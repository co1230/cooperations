from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import after_sale as after_sale_crud
from crud import operation_log as log_crud
from models.admin import Admin
from schemas.after_sale import AfterSaleHandleRequest
from utils.auth import get_client_ip, get_current_admin
from utils.exception import BizException
from utils.response import success_response

router = APIRouter(prefix="/api/after-sale", tags=["售后介入"])


@router.get("/list")
async def get_after_sale_list(
        page: int = 1,
        page_size: int = 10,
        status: Optional[int] = Query(None, ge=0, le=3, description="状态：0待处理 1平台已介入 2已完成 3已关闭"),
        type_: Optional[str] = Query(None, alias="type", description="类型：return退货 refund退款"),
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    total, list_data = await after_sale_crud.get_after_sale_list(db, status, type_, page, page_size)
    return success_response(message="获取售后单列表成功", data={"total": total, "list": list_data})


@router.get("/stats")
async def get_after_sale_stats(
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    stats = await after_sale_crud.get_after_sale_stats(db)
    return success_response(message="获取售后统计成功", data=stats)


@router.put("/intervene/{after_sale_id}")
async def intervene(
        after_sale_id: int,
        request: Request,
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 手动介入：仅待处理状态的售后单可介入（超时未处理的由定时任务自动介入）
    after_sale = await after_sale_crud.get_after_sale_by_id(db, after_sale_id)
    if not after_sale:
        raise BizException("售后单不存在")
    if after_sale.status != 0:
        raise BizException("当前状态不允许平台介入")
    await after_sale_crud.intervene(db, after_sale)
    await log_crud.create_log(
        db, admin.id, admin.username, "平台介入",
        target_type="after_sale", target_id=after_sale.id,
        detail=f"管理员手动介入售后单 {after_sale.after_sale_no}",
        ip=get_client_ip(request)
    )
    return success_response(message="平台介入成功")


@router.put("/refund/{after_sale_id}")
async def refund(
        after_sale_id: int,
        request: Request,
        handle_data: Optional[AfterSaleHandleRequest] = None,
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 强制退款：待处理 / 平台已介入 状态可退款，同步更新订单状态为已退款
    after_sale = await after_sale_crud.get_after_sale_by_id(db, after_sale_id)
    if not after_sale:
        raise BizException("售后单不存在")
    if after_sale.status not in (0, 1):
        raise BizException("当前状态不允许强制退款")
    result_text = handle_data.result if handle_data and handle_data.result else "管理员强制退款"
    await after_sale_crud.refund(db, after_sale, result_text)
    await log_crud.create_log(
        db, admin.id, admin.username, "强制退款",
        target_type="after_sale", target_id=after_sale.id,
        detail=f"对售后单 {after_sale.after_sale_no} 执行强制退款",
        ip=get_client_ip(request)
    )
    return success_response(message="强制退款成功")


@router.put("/close/{after_sale_id}")
async def close_dispute(
        after_sale_id: int,
        request: Request,
        handle_data: Optional[AfterSaleHandleRequest] = None,
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 关闭争议：待处理 / 平台已介入 状态可关闭
    after_sale = await after_sale_crud.get_after_sale_by_id(db, after_sale_id)
    if not after_sale:
        raise BizException("售后单不存在")
    if after_sale.status not in (0, 1):
        raise BizException("当前状态不允许关闭争议")
    result_text = handle_data.result if handle_data and handle_data.result else "管理员关闭争议"
    await after_sale_crud.close(db, after_sale, result_text)
    await log_crud.create_log(
        db, admin.id, admin.username, "关闭争议",
        target_type="after_sale", target_id=after_sale.id,
        detail=f"关闭售后单 {after_sale.after_sale_no} 的争议",
        ip=get_client_ip(request)
    )
    return success_response(message="关闭争议成功")
