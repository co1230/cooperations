# backend/crud/order.py

from typing import Optional

from datetime import datetime

from sqlalchemy import select, func

from sqlalchemy.ext.asyncio import AsyncSession


from models.order import Order





# =====================================================
# 获取订单列表
# =====================================================

async def get_order_list(

        session: AsyncSession,

        page: int = 1,

        page_size: int = 10,

        keyword: Optional[str] = None

):


    query = select(Order)



    # 搜索订单编号 / 商品名称

    if keyword:


        query = query.where(

            Order.order_no.like(f"%{keyword}%")

            |

            Order.product_name.like(f"%{keyword}%")

        )




    # 查询总数量

    count_query = select(

        func.count()

    ).select_from(

        query.subquery()

    )


    total_result = await session.execute(

        count_query

    )


    total = total_result.scalar()




    # 分页

    query = query.offset(

        (page - 1) * page_size

    ).limit(

        page_size

    )



    result = await session.execute(

        query

    )



    orders = result.scalars().all()



    return {

        "total": total,

        "list": orders

    }








# =====================================================
# 根据ID查询订单
# =====================================================

async def get_order_by_id(

        session: AsyncSession,

        order_id:int

):


    result = await session.execute(

        select(Order)

        .where(

            Order.id == order_id

        )

    )


    return result.scalar_one_or_none()







# =====================================================
# 商家发货
# =====================================================

async def ship_order(

        session: AsyncSession,

        order:Order,

        express_company:str,

        tracking_number:str

):


    # 修改物流信息

    order.express_company = express_company


    order.tracking_number = tracking_number



    # 修改订单状态

    # 1 待发货

    # 2 已发货

    order.status = 2



    # 发货时间

    order.shipped_at = datetime.now()




    await session.commit()



    await session.refresh(order)



    return order







# =====================================================
# 修改订单状态
# =====================================================

async def update_order_status(

        session: AsyncSession,

        order:Order,

        status:int

):


    order.status = status


    await session.commit()


    await session.refresh(order)


    return order
