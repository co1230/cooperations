from datetime import datetime

from sqlalchemy import (
    select,
    func,
    extract
)

from sqlalchemy.ext.asyncio import AsyncSession


from models.order import Order





# ==================================================
# 商家营收统计
# ==================================================

async def get_statistics(

        session:AsyncSession

):



    # ----------------------------------
    # 总收入
    # ----------------------------------

    total_income_result = await session.execute(

        select(

            func.sum(Order.total_amount)

        )

    )


    total_income = (

        total_income_result.scalar()

        or 0

    )







    # ----------------------------------
    # 已完成订单收入
    #
    # status = 3
    # ----------------------------------


    completed_income_result = await session.execute(


        select(

            func.sum(Order.total_amount)

        )

        .where(

            Order.status == 3

        )


    )



    completed_income=(

        completed_income_result.scalar()

        or 0

    )








    # ----------------------------------
    # 订单总数量
    # ----------------------------------


    order_count_result = await session.execute(

        select(

            func.count(Order.id)

        )

    )


    order_count = order_count_result.scalar()





    # ----------------------------------
    # 已完成订单数量
    # ----------------------------------


    completed_order_result = await session.execute(


        select(

            func.count(Order.id)

        )

        .where(

            Order.status==3

        )

    )



    completed_order_count = (

        completed_order_result.scalar()

    )








    # ----------------------------------
    # 今日收入
    # ----------------------------------


    today=datetime.now().date()



    today_income_result = await session.execute(


        select(

            func.sum(Order.total_amount)

        )

        .where(

            func.date(Order.created_at)==today

        )


    )



    today_income=(

        today_income_result.scalar()

        or 0

    )








    # ----------------------------------
    # 月收入趋势
    # ----------------------------------


    monthly_result = await session.execute(


        select(

            extract(

                "month",

                Order.created_at

            ).label("month"),


            func.sum(

                Order.total_amount

            )

            .label("amount")


        )

        .group_by(

            extract(

                "month",

                Order.created_at

            )

        )


        .order_by(

            "month"

        )

    )




    monthly_income=[]



    for row in monthly_result:


        monthly_income.append(

            {

                "month":

                str(int(row.month)),


                "amount":

                float(row.amount or 0)

            }

        )







    return {


        "total_income":

        float(total_income),



        "completed_income":

        float(completed_income),



        "order_count":

        order_count,



        "completed_order_count":

        completed_order_count,



        "today_income":

        float(today_income),



        "monthly_income":

        monthly_income

    }
