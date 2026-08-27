from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import operation_log as log_crud
from crud import user as user_crud
from models.admin import Admin
from schemas.user import UserBanRequest, UserManageResponse
from utils.auth import get_client_ip, get_current_admin
from utils.exception import BizException
from utils.response import success_response

router = APIRouter(prefix="/api/admin/user", tags=["用户管理"])


@router.get("/list")
async def get_user_list(
        page: int = 1,
        page_size: int = 10,
        keyword: Optional[str] = None,
        status: Optional[int] = Query(None, ge=0, le=1, description="账号状态：0正常 1封禁"),
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    total, users = await user_crud.get_user_list(db, keyword, status, page, page_size)
    list_data = [UserManageResponse.model_validate(u) for u in users]
    return success_response(message="获取用户列表成功", data={"total": total, "list": list_data})


@router.put("/ban/{user_id}")
async def ban_user(
        user_id: int,
        ban_data: UserBanRequest,
        request: Request,
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 封禁逻辑：校验用户 -> 校验未被封禁 -> 封禁 -> 记录日志
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise BizException("用户不存在")
    if user.status == 1:
        raise BizException("该用户已被封禁")
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
        detail=detail,
        ip=get_client_ip(request)
    )
    return success_response(message="封禁成功")


@router.put("/unban/{user_id}")
async def unban_user(
        user_id: int,
        request: Request,
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 解封逻辑：校验用户 -> 校验已被封禁 -> 解封 -> 记录日志
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise BizException("用户不存在")
    if user.status == 0:
        raise BizException("该用户未被封禁")
    await user_crud.unban_user(db, user)
    await log_crud.create_log(
        db, admin.id, admin.username, "解封用户",
        target_type="user", target_id=user.id,
        detail=f"解封用户 {user.username}", ip=get_client_ip(request)
    )
    return success_response(message="解封成功")
