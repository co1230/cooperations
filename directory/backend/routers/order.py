from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession


from config.db_conf import get_db

from crud import order as order_crud

from schemas.order import OrderShip



router = APIRouter(

    prefix="/api/order",

    tags=["订单管理"]

)



# ==========================
# 订单列表
# ==========================

@router.get("/list")
async def order_list(
        db:AsyncSession = Depends(get_db)
):

    result = await order_crud.get_order_list(
        db
    )


    return {

        "code":200,

        "message":"获取订单成功",

        "data":result

    }





# ==========================
# 商家发货
# ==========================

@router.put("/ship/{order_id}")

async def ship_order(

        order_id:int,

        data:OrderShip,

        db:AsyncSession=Depends(get_db)

):


    order = await order_crud.get_order_by_id(
        db,
        order_id
    )


    result = await order_crud.ship_order(

        db,

        order,

        data.express_company,

        data.tracking_number

    )


    return {

        "code":200,

        "message":"发货成功",

        "data":result

    }
