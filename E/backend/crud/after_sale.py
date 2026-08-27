from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.after_sale import AfterSale
from models.order import Order
from models.user import User


async def get_after_sale_by_id(db: AsyncSession, after_sale_id: int) -> Optional[AfterSale]:
    """根据ID查询售后单"""
    return await db.get(AfterSale, after_sale_id)


async def get_after_sale_list(
        db: AsyncSession, status: Optional[int], type_: Optional[str], page: int, page_size: int
) -> Tuple[int, List[dict]]:
    """分页查询售后单列表（关联订单号、商品名称、申请用户名）"""
    filters = []
    if status is not None:
        filters.append(AfterSale.status == status)
    if type_ is not None:
        filters.append(AfterSale.type == type_)

    total = await db.scalar(select(func.count()).select_from(AfterSale).where(*filters))

    stmt = (
        select(AfterSale, Order.order_no, Order.product_name, User.username, User.status.label("user_status"))
        .join(Order, AfterSale.order_id == Order.id)
        .join(User, AfterSale.user_id == User.id)
        .where(*filters)
        .order_by(AfterSale.status.asc(), AfterSale.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    now = datetime.now()
    list_data = []
    for row in result.all():
        item = row[0]
        list_data.append({
            "id": item.id,
            "after_sale_no": item.after_sale_no,
            "order_no": row.order_no,
            "product_name": row.product_name,
            "username": row.username,
            "user_status": row.user_status,
            "type": item.type,
            "reason": item.reason,
            "status": item.status,
            "deadline": item.deadline,
            "is_platform_intervened": item.is_platform_intervened,
            "is_overdue": item.status == 0 and item.deadline < now,
            "result": item.result,
            "created_at": item.created_at,
        })
    return total, list_data


async def get_after_sale_stats(db: AsyncSession) -> dict:
    """售后单状态统计（含超时未处理数量）"""
    now = datetime.now()
    pending = await db.scalar(select(func.count()).select_from(AfterSale).where(AfterSale.status == 0))
    intervened = await db.scalar(select(func.count()).select_from(AfterSale).where(AfterSale.status == 1))
    completed = await db.scalar(select(func.count()).select_from(AfterSale).where(AfterSale.status == 2))
    closed = await db.scalar(select(func.count()).select_from(AfterSale).where(AfterSale.status == 3))
    overdue = await db.scalar(
        select(func.count()).select_from(AfterSale)
        .where(AfterSale.status == 0, AfterSale.deadline < now)
    )
    return {
        "pending": pending or 0,
        "intervened": intervened or 0,
        "completed": completed or 0,
        "closed": closed or 0,
        "overdue": overdue or 0,
    }


async def intervene(db: AsyncSession, after_sale: AfterSale) -> AfterSale:
    """平台介入：状态 0 → 1"""
    after_sale.status = 1
    after_sale.is_platform_intervened = True
    after_sale.updated_at = datetime.now()
    return after_sale


async def refund(db: AsyncSession, after_sale: AfterSale, result: str) -> AfterSale:
    """强制退款：售后单状态 → 2，关联订单状态 → 4（已退款）"""
    after_sale.status = 2
    after_sale.is_platform_intervened = True
    after_sale.result = result
    after_sale.updated_at = datetime.now()
    order = await db.get(Order, after_sale.order_id)
    if order:
        order.status = 4
        order.updated_at = datetime.now()
    return after_sale


async def close(db: AsyncSession, after_sale: AfterSale, result: str) -> AfterSale:
    """关闭争议：售后单状态 → 3"""
    after_sale.status = 3
    after_sale.is_platform_intervened = True
    after_sale.result = result
    after_sale.updated_at = datetime.now()
    return after_sale
