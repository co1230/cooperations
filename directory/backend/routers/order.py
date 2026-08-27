from fastapi import APIRouter, Depends, HTTPException, Query

from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db

from crud import order as order_crud

from schemas.order import OrderShip



router = APIRouter(

    prefix="/api/order",

    tags=["订单管理"]

)





# =====================================================
# 获取订单列表
# GET /api/order/list
# =====================================================

@router.get("/list")
async def get_order_list(

        page: int = Query(1, ge=1),

        page_size: int = Query(10, ge=1, le=100),

        keyword: str | None = None,

        db: AsyncSession = Depends(get_db)

):


    result = await order_crud.get_order_list(

        session=db,

        page=page,

        page_size=page_size,

        keyword=keyword

    )


    return {

        "code":200,

        "message":"获取订单列表成功",

        "data":result

    }







# =====================================================
# 商家发货
# PUT /api/order/ship/{order_id}
# =====================================================

@router.put("/ship/{order_id}")

async def ship_order(

        order_id:int,

        data:OrderShip,

        db:AsyncSession = Depends(get_db)

):


    order = await order_crud.get_order_by_id(

        session=db,

        order_id=order_id

    )


    if order is None:

        raise HTTPException(

            status_code=404,

            detail="订单不存在"

        )



    result = await order_crud.ship_order(

        session=db,

        order=order,

        express_company=data.express_company,

        tracking_number=data.tracking_number

    )



    return {

        "code":200,

        "message":"发货成功",

        "data":result

    }
