from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.after_sale import AfterSaleTicket
from models.order import Order
from models.order_item import OrderItem
from models.order_status_log import OrderStatusLog
from models.payment_record import PaymentRecord
from models.user import User


def can_intervene(
        ticket: AfterSaleTicket,
        order_status: str,
        after_sale_status: str,
        has_newer_ticket: bool,
        decision: str,
) -> bool:
    """
    平台介入资格校验（对齐 A 任务 mock-api.js 的 canIntervene）：
    - 已被平台处理过 / 订单已退款 / 订单履约状态不在 (PAID, SHIPPED, COMPLETED) / 存在更新的工单 → 不可介入
    - FORCE_REFUND（强制退款）：status ∈ (APPLIED, PROCESSING, APPROVED, REJECTED)，可覆盖商家已拒绝
    - REJECT（驳回）：status ∈ (APPLIED, PROCESSING, APPROVED)
    """
    if ticket.platform_intervention:
        return False
    if after_sale_status == "REFUNDED":
        return False
    if order_status not in ("PAID", "SHIPPED", "COMPLETED"):
        return False
    if has_newer_ticket:
        return False
    if decision == "FORCE_REFUND":
        return ticket.status in ("APPLIED", "PROCESSING", "APPROVED", "REJECTED")
    return ticket.status in ("APPLIED", "PROCESSING", "APPROVED")


async def get_ticket_by_id(db: AsyncSession, ticket_id: int) -> Optional[AfterSaleTicket]:
    """根据ID查询售后工单"""
    return await db.get(AfterSaleTicket, ticket_id)


async def get_order_by_id(db: AsyncSession, order_id: int) -> Optional[Order]:
    """根据ID查询订单"""
    return await db.get(Order, order_id)


async def get_ticket_list(
        db: AsyncSession,
        status: Optional[str],
        ticket_type: Optional[str],
        page: int,
        page_size: int,
) -> Tuple[int, List[dict]]:
    """分页查询售后工单列表（关联订单、买家信息），服务端计算平台可操作标记"""
    filters = []
    if status:
        filters.append(AfterSaleTicket.status == status)
    if ticket_type:
        filters.append(AfterSaleTicket.ticket_type == ticket_type)

    total = await db.scalar(select(func.count()).select_from(AfterSaleTicket).where(*filters))

    stmt = (
        select(
            AfterSaleTicket,
            Order.order_no,
            Order.order_status,
            Order.after_sale_status,
            User.username,
            User.account_status,
        )
        .join(Order, AfterSaleTicket.order_id == Order.id)
        .join(User, AfterSaleTicket.buyer_id == User.id)
        .where(*filters)
        .order_by(AfterSaleTicket.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.execute(stmt)).all()
    tickets = [row[0] for row in rows]
    order_ids = list({t.order_id for t in tickets})

    # 商品名称快照：每个订单取第一条明细
    product_names = {}
    if order_ids:
        items = (await db.execute(
            select(OrderItem.order_id, OrderItem.product_name)
            .where(OrderItem.order_id.in_(order_ids))
            .order_by(OrderItem.id.asc())
        )).all()
        seen = set()
        for oid, name in items:
            if oid not in seen:
                seen.add(oid)
                product_names[oid] = name

    # 每个订单的最新工单ID：判断是否存在更新的售后申请
    newer_map = {}
    if order_ids:
        max_rows = (await db.execute(
            select(AfterSaleTicket.order_id, func.max(AfterSaleTicket.id))
            .where(AfterSaleTicket.order_id.in_(order_ids))
            .group_by(AfterSaleTicket.order_id)
        )).all()
        newer_map = {oid: max_id for oid, max_id in max_rows}

    now = datetime.now()
    list_data = []
    for row in rows:
        ticket, order_no, order_status, after_sale_status, username, account_status = row
        has_newer = ticket.id < newer_map.get(ticket.order_id, ticket.id)
        list_data.append({
            "id": ticket.id,
            "ticket_no": ticket.ticket_no,
            "order_no": order_no,
            "product_name": product_names.get(ticket.order_id),
            "buyer_name": username,
            "user_account_status": account_status,
            "ticket_type": ticket.ticket_type,
            "reason": ticket.reason,
            "requested_amount": ticket.requested_amount,
            "merchant_reply": ticket.merchant_reply,
            "status": ticket.status,
            "deadline": ticket.deadline,
            "is_platform_intervened": ticket.is_platform_intervened,
            "platform_intervention": ticket.platform_intervention,
            "is_overdue": ticket.status == "APPLIED"
                          and ticket.deadline is not None
                          and ticket.deadline < now,
            "can_force_refund": can_intervene(ticket, order_status, after_sale_status, has_newer, "FORCE_REFUND"),
            "can_reject": can_intervene(ticket, order_status, after_sale_status, has_newer, "REJECT"),
            "created_at": ticket.created_at,
        })
    return total, list_data


async def get_ticket_stats(db: AsyncSession) -> dict:
    """售后工单状态统计（含超时未处理数量）"""
    now = datetime.now()
    pending = await db.scalar(
        select(func.count()).select_from(AfterSaleTicket).where(AfterSaleTicket.status == "APPLIED")
    )
    overdue = await db.scalar(
        select(func.count()).select_from(AfterSaleTicket).where(
            AfterSaleTicket.status == "APPLIED",
            AfterSaleTicket.deadline.isnot(None),
            AfterSaleTicket.deadline < now,
        )
    )
    processing = await db.scalar(
        select(func.count()).select_from(AfterSaleTicket).where(AfterSaleTicket.status == "PROCESSING")
    )
    completed = await db.scalar(
        select(func.count()).select_from(AfterSaleTicket).where(AfterSaleTicket.status == "COMPLETED")
    )
    closed = await db.scalar(
        select(func.count()).select_from(AfterSaleTicket).where(
            or_(AfterSaleTicket.status == "REJECTED", AfterSaleTicket.status == "CLOSED")
        )
    )
    return {
        "pending": pending or 0,
        "overdue": overdue or 0,
        "processing": processing or 0,
        "completed": completed or 0,
        "closed": closed or 0,
    }


async def intervene(
        db: AsyncSession, ticket: AfterSaleTicket, order: Order, operator_id: Optional[int]
) -> AfterSaleTicket:
    """平台介入：工单 APPLIED → PROCESSING，同步订单售后状态，写状态变更日志"""
    now = datetime.now()
    previous = order.after_sale_status
    ticket.status = "PROCESSING"
    ticket.is_platform_intervened = True
    ticket.updated_at = now
    order.after_sale_status = "PROCESSING"
    order.updated_at = now
    db.add(OrderStatusLog(
        order_id=order.id, operator_id=operator_id, status_type="AFTER_SALE",
        from_status=previous, to_status="PROCESSING", remark="平台介入处理",
    ))
    return ticket


async def force_refund(
        db: AsyncSession, ticket: AfterSaleTicket, order: Order, reason: str, operator: User
) -> AfterSaleTicket:
    """
    平台强制退款（对齐 A 任务 interveneRefund 的 FORCE_REFUND 分支）：
    - 工单 → COMPLETED，记录平台处理结果（platform_intervention）
    - 订单售后状态 → REFUNDED（不覆盖履约状态 order_status）
    - 全额退款时同步支付流水 SUCCESS → REFUNDED
    - 写订单售后状态变更日志
    """
    now = datetime.now()
    previous = order.after_sale_status
    ticket.status = "COMPLETED"
    ticket.completed_at = now
    ticket.is_platform_intervened = True
    ticket.platform_intervention = {
        "decision": "FORCE_REFUND",
        "reason": reason,
        "operator_id": operator.id,
        "operator_name": operator.username,
        "created_at": now.isoformat(),
    }
    ticket.updated_at = now
    order.after_sale_status = "REFUNDED"
    order.updated_at = now
    db.add(OrderStatusLog(
        order_id=order.id, operator_id=operator.id, status_type="AFTER_SALE",
        from_status=previous, to_status="REFUNDED", remark=f"平台强制退款：{reason}",
    ))
    # 全额退款同步支付流水状态（对齐 A：不产生新退款记录，原履约状态不变）
    if ticket.requested_amount is not None:
        amount_cents = int(round(Decimal(str(ticket.requested_amount)) * 100))
        total_cents = int(round(Decimal(str(order.total_amount)) * 100))
        if amount_cents == total_cents:
            await db.execute(
                update(PaymentRecord)
                .where(PaymentRecord.order_id == order.id, PaymentRecord.payment_status == "SUCCESS")
                .values(payment_status="REFUNDED")
            )
    return ticket


async def reject(
        db: AsyncSession, ticket: AfterSaleTicket, order: Order, reason: str, operator: User
) -> AfterSaleTicket:
    """
    平台驳回申请（对齐 A 任务 interveneRefund 的 REJECT 分支）：
    - 工单 → REJECTED，订单售后状态 → REJECTED
    - 不产生退款记录、不动支付流水
    """
    now = datetime.now()
    previous = order.after_sale_status
    ticket.status = "REJECTED"
    ticket.is_platform_intervened = True
    ticket.platform_intervention = {
        "decision": "REJECT",
        "reason": reason,
        "operator_id": operator.id,
        "operator_name": operator.username,
        "created_at": now.isoformat(),
    }
    ticket.updated_at = now
    order.after_sale_status = "REJECTED"
    order.updated_at = now
    db.add(OrderStatusLog(
        order_id=order.id, operator_id=operator.id, status_type="AFTER_SALE",
        from_status=previous, to_status="REJECTED", remark=f"平台驳回：{reason}",
    ))
    return ticket
