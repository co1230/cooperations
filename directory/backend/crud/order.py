from datetime import datetime

from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession

from models.order import Order



# ==========================
# 查询订单列表
# ==========================

async def get_order_list(
        session: AsyncSession
):

    result = await session.execute(
        select(Order)
    )

    return result.scalars().all()



# ==========================
# 根据ID查询
# ==========================

async def get_order_by_id(
        session: AsyncSession,
        order_id:int
):

    result = await session.execute(
        select(Order)
        .where(Order.id == order_id)
    )

    return result.scalar_one_or_none()



# ==========================
# 商家发货
# ==========================

async def ship_order(
        session:AsyncSession,
        order:Order,
        express_company:str,
        tracking_number:str
):

    order.express_company = express_company

    order.tracking_number = tracking_number

    order.status = 2

    order.shipped_at = datetime.now()


    await session.commit()

    await session.refresh(order)


    return order
