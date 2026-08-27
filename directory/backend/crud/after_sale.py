from typing import Optional

from sqlalchemy import select,func

from sqlalchemy.ext.asyncio import AsyncSession

from models.after_sale import AfterSale





# =====================================================
# 获取售后列表
# =====================================================

async def get_after_sale_list(

        session:AsyncSession,

        page:int=1,

        page_size:int=10,

        status:Optional[int]=None

):


    query = select(AfterSale)



    if status is not None:

        query=query.where(

            AfterSale.status==status

        )




    count_query=select(

        func.count()

    ).select_from(

        query.subquery()

    )



    total_result=await session.execute(

        count_query

    )


    total=total_result.scalar()





    query=query.offset(

        (page-1)*page_size

    ).limit(

        page_size

    )



    result=await session.execute(query)



    data=result.scalars().all()



    return {

        "total":total,

        "list":data

    }







# =====================================================
# 查询详情
# =====================================================

async def get_after_sale_by_id(

        session:AsyncSession,

        after_sale_id:int

):


    result=await session.execute(

        select(AfterSale)

        .where(

            AfterSale.id==after_sale_id

        )

    )


    return result.scalar_one_or_none()







# =====================================================
# 商家审核售后
# =====================================================

async def audit_after_sale(

        session:AsyncSession,

        after_sale:AfterSale,

        status:int,

        result:str|None

):


    after_sale.status=status


    after_sale.result=result



    await session.commit()



    await session.refresh(after_sale)



    return after_sale
