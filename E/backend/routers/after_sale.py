from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import after_sale as after_sale_crud
from crud import operation_log as log_crud
from models.after_sale import AfterSaleTicket
from models.user import User
from schemas.after_sale import AfterSaleHandleRequest, AfterSaleListResponse
from utils.auth import get_client_ip, get_current_admin
from utils.exception import BizException
from utils.response import success_response

router = APIRouter(prefix="/api/after-sale", tags=["售后介入"])


@router.get("/list")
async def get_ticket_list(
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = Query(None, description="工单状态：APPLIED/PROCESSING/APPROVED/REJECTED/BUYER_SHIPPED/REFUNDING/COMPLETED/CLOSED"),
        ticket_type: Optional[str] = Query(None, alias="type", description="工单类型：REFUND_ONLY/RETURN_REFUND/EXCHANGE"),
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    total, raw_list = await after_sale_crud.get_ticket_list(db, status, ticket_type, page, page_size)
    # 统一走 Pydantic 校验后再响应
    list_data = [AfterSaleListResponse(**item) for item in raw_list]
    return success_response(message="获取售后工单列表成功", data={"total": total, "list": list_data})


@router.get("/stats")
async def get_ticket_stats(
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    stats = await after_sale_crud.get_ticket_stats(db)
    return success_response(message="获取售后统计成功", data=stats)


@router.put("/intervene/{ticket_id}")
async def intervene(
        ticket_id: int,
        request: Request,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    # 手动介入：仅待审核（APPLIED）且未被平台介入过的工单可介入
    # 超时未处理的工单由定时任务自动介入
    ticket = await after_sale_crud.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise BizException("售后工单不存在")
    if ticket.status != "APPLIED" or ticket.is_platform_intervened:
        raise BizException("当前工单状态不允许平台介入")
    order = await after_sale_crud.get_order_by_id(db, ticket.order_id)
    if not order:
        raise BizException("关联订单不存在")
    await after_sale_crud.intervene(db, ticket, order, admin.id)
    await log_crud.create_log(
        db, admin.id, admin.username, "平台介入",
        target_type="after_sale", target_id=ticket.id,
        detail=f"管理员手动介入售后工单 {ticket.ticket_no}",
        ip=get_client_ip(request)
    )
    return success_response(message="平台介入成功")


async def _guard_ticket(
        db: AsyncSession, ticket_id: int
) -> tuple[Optional[AfterSaleTicket], object]:
    """售后工单操作公共校验：工单存在 + 关联订单存在"""
    ticket = await after_sale_crud.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise BizException("售后工单不存在")
    order = await after_sale_crud.get_order_by_id(db, ticket.order_id)
    if not order:
        raise BizException("关联订单不存在")
    return ticket, order


async def _check_newer_ticket(db: AsyncSession, ticket: AfterSaleTicket) -> None:
    """校验是否存在更新的售后申请（对齐 A 任务：已有新申请不可处理旧工单）"""
    result = await db.execute(
        select(AfterSaleTicket.id)
        .where(AfterSaleTicket.order_id == ticket.order_id, AfterSaleTicket.id > ticket.id)
        .limit(1)
    )
    if result.scalars().first():
        raise BizException("该订单已有新的售后申请，请处理最新工单")


@router.put("/refund/{ticket_id}")
async def force_refund(
        ticket_id: int,
        request: Request,
        handle_data: Optional[AfterSaleHandleRequest] = None,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    """
    平台强制退款（对齐 A 任务 interveneRefund 的 FORCE_REFUND 分支）：
    1. 原因必填（1-200字）
    2. 不可重复介入、订单未退款、履约状态 ∈ (PAID, SHIPPED, COMPLETED)、无更新工单
    3. 可覆盖商家已拒绝的最新申请
    4. 退款只改售后状态（after_sale_status → REFUNDED），不动履约状态
    5. 全额退款同步支付流水 → REFUNDED
    """
    ticket, order = await _guard_ticket(db, ticket_id)
    if not handle_data or not handle_data.reason.strip():
        raise BizException("请填写 1-200 字平台处理原因")
    reason = handle_data.reason.strip()
    if ticket.platform_intervention:
        raise BizException("该工单已被平台处理，不能重复介入")
    if order.after_sale_status == "REFUNDED":
        raise BizException("该订单已退款，不能重复退款")
    if order.order_status not in ("PAID", "SHIPPED", "COMPLETED"):
        raise BizException("订单当前状态不允许退款")
    await _check_newer_ticket(db, ticket)
    if ticket.status not in ("APPLIED", "PROCESSING", "APPROVED", "REJECTED"):
        raise BizException("当前工单状态不允许强制退款")
    if ticket.requested_amount is None or ticket.requested_amount <= 0 \
            or ticket.requested_amount > order.total_amount:
        raise BizException("工单退款金额无效，无法执行退款")
    await after_sale_crud.force_refund(db, ticket, order, reason, admin)
    await log_crud.create_log(
        db, admin.id, admin.username, "强制退款",
        target_type="after_sale", target_id=ticket.id,
        detail=f"对售后工单 {ticket.ticket_no} 执行强制退款，金额 {ticket.requested_amount}，原因：{reason}",
        ip=get_client_ip(request)
    )
    return success_response(message="强制退款成功")


@router.put("/close/{ticket_id}")
async def reject_ticket(
        ticket_id: int,
        request: Request,
        handle_data: Optional[AfterSaleHandleRequest] = None,
        admin: User = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    """
    关闭争议/驳回申请（对齐 A 任务 interveneRefund 的 REJECT 分支）：
    1. 原因必填（1-200字）
    2. 商家已驳回（REJECTED）的工单不可再驳回，但可强制退款
    3. 驳回不产生退款记录、不动支付流水
    """
    ticket, order = await _guard_ticket(db, ticket_id)
    if not handle_data or not handle_data.reason.strip():
        raise BizException("请填写 1-200 字平台处理原因")
    reason = handle_data.reason.strip()
    if ticket.platform_intervention:
        raise BizException("该工单已被平台处理，不能重复介入")
    if order.after_sale_status == "REFUNDED":
        raise BizException("该订单已退款，不能驳回")
    if order.order_status not in ("PAID", "SHIPPED", "COMPLETED"):
        raise BizException("订单当前状态不允许驳回")
    await _check_newer_ticket(db, ticket)
    if ticket.status not in ("APPLIED", "PROCESSING", "APPROVED"):
        raise BizException("当前工单状态不允许驳回")
    await after_sale_crud.reject(db, ticket, order, reason, admin)
    await log_crud.create_log(
        db, admin.id, admin.username, "关闭争议",
        target_type="after_sale", target_id=ticket.id,
        detail=f"驳回售后工单 {ticket.ticket_no}，原因：{reason}",
        ip=get_client_ip(request)
    )
    return success_response(message="驳回成功，争议已关闭")
