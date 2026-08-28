from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import operation_log as log_crud
from crud import user as user_crud
from models.user import User
from schemas.user import MerchantRejectRequest, UserBanRequest, UserManageResponse
from utils.auth import get_client_ip, get_current_admin
from utils.exception import BizException
from utils.response import success_response

router = APIRouter(prefix="/api/admin/user", tags=["用户管理"])

# 商家入驻审核路由（对齐 A 任务：管理员"商家审核"模块）
merchant_router = APIRouter(prefix="/api/admin/merchant", tags=["商家审核"])


@router.get("/list")
async def get_user_list(
        page: int = 1,
        page_size: int = 10,
        keyword: Optional[str] = None,
        role: Optional[str] = Query(None, description="角色：BUYER / MERCHANT / ADMIN"),
        account_status: Optional[str] = Query(None, description="账号状态：ACTIVE / DISABLED / PENDING"),
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    total, users = await user_crud.get_user_list(db, keyword, role, account_status, page, page_size)
    list_data = [UserManageResponse.model_validate(u) for u in users]
    return success_response(message="获取用户列表成功", data={"total": total, "list": list_data})


@router.put("/ban/{user_id}")
async def ban_user(
        user_id: int,
        ban_data: UserBanRequest,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 封禁逻辑（对齐 A 任务）：管理员账号受保护；仅正常状态可封禁
    # 校验用户 -> 保护规则 -> 封禁 -> 可选关闭待付款订单 -> 记录日志
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise BizException("用户不存在")
    if user.role == "ADMIN":
        raise BizException("管理员账号受保护，不能封禁")
    if user.account_status != "ACTIVE":
        raise BizException("该账号当前状态不可封禁")
    await user_crud.ban_user(db, user, ban_data.ban_reason, ban_data.ban_duration_hours)
    # 联动：可选关闭该用户的待付款订单（已付款订单和售后单不受影响，继续流转）
    closed_count = 0
    if ban_data.close_unpaid_orders:
        closed_count = await user_crud.close_unpaid_orders(db, user)
    duration_text = f"{ban_data.ban_duration_hours}小时" if ban_data.ban_duration_hours > 0 else "永久"
    detail = f"封禁用户 {user.username}，原因：{ban_data.ban_reason}，时长：{duration_text}"
    if closed_count:
        detail += f"，同时关闭其 {closed_count} 笔待付款订单"
    await log_crud.create_log(
        db, admin.id, admin.username, "封禁用户",
        target_type="user", target_id=user.id,
        detail=detail, ip=get_client_ip(request)
    )
    return success_response(message="封禁成功")


@router.put("/unban/{user_id}")
async def unban_user(
        user_id: int,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 解封逻辑（对齐 A 任务）：管理员账号受保护；待审核账号不能通过解封绕过审核
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise BizException("用户不存在")
    if user.role == "ADMIN":
        raise BizException("管理员账号受保护，不能操作")
    if user.account_status == "PENDING":
        raise BizException("待审核账号不能通过解封绕过审核")
    if user.account_status != "DISABLED":
        raise BizException("该账号未被封禁")
    await user_crud.unban_user(db, user)
    await log_crud.create_log(
        db, admin.id, admin.username, "解封用户",
        target_type="user", target_id=user.id,
        detail=f"解封用户 {user.username}", ip=get_client_ip(request)
    )
    return success_response(message="解封成功")


# ============ 商家入驻审核 ============


@merchant_router.get("/applications")
async def get_merchant_applications(
        page: int = 1,
        page_size: int = 10,
        account_status: Optional[str] = Query("PENDING", description="账号状态筛选，默认待审核"),
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    total, users = await user_crud.get_merchant_applications(db, account_status, page, page_size)
    list_data = [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "account_status": u.account_status,
            "merchant_application": u.merchant_application,
            "created_at": u.created_at,
        }
        for u in users
    ]
    return success_response(message="获取商家入驻申请成功", data={"total": total, "list": list_data})


@merchant_router.post("/approve/{user_id}")
async def approve_merchant(
        user_id: int,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 通过入驻申请：待审核 -> 开通商家登录（对齐 A 任务：重复审核被拦截）
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise BizException("账号不存在")
    if user.role != "MERCHANT" or user.account_status != "PENDING":
        raise BizException("该账号不在待审核状态")
    application = user.merchant_application or {}
    if application.get("review"):
        raise BizException("该申请已审核，不能重复审核")
    await user_crud.approve_merchant(db, user, admin)
    shop_name = application.get("shop_name") or user.username
    await log_crud.create_log(
        db, admin.id, admin.username, "商家审核通过",
        target_type="user", target_id=user.id,
        detail=f"通过商家入驻申请：{shop_name}（{user.username}）", ip=get_client_ip(request)
    )
    return success_response(message="审核通过，商家已开通登录")


@merchant_router.post("/reject/{user_id}")
async def reject_merchant(
        user_id: int,
        reject_data: MerchantRejectRequest,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 驳回入驻申请：必须填写原因（对齐 A 任务：拒绝后不可登录，不可重复审核）
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise BizException("账号不存在")
    if user.role != "MERCHANT" or user.account_status != "PENDING":
        raise BizException("该账号不在待审核状态")
    application = user.merchant_application or {}
    if application.get("review"):
        raise BizException("该申请已审核，不能重复审核")
    await user_crud.reject_merchant(db, user, admin, reject_data.remark)
    shop_name = application.get("shop_name") or user.username
    await log_crud.create_log(
        db, admin.id, admin.username, "商家审核驳回",
        target_type="user", target_id=user.id,
        detail=f"驳回商家入驻申请：{shop_name}（{user.username}），原因：{reject_data.remark}",
        ip=get_client_ip(request)
    )
    return success_response(message="已驳回该申请")
