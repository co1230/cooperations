from fastapi import APIRouter,Depends,HTTPException,Query

from sqlalchemy.ext.asyncio import AsyncSession


from config.db_conf import get_db


from crud import after_sale as after_sale_crud


from schemas.after_sale import AfterSaleAudit





router=APIRouter(

    prefix="/api/after-sale",

    tags=["售后管理"]

)





# =====================================================
# 售后列表
# =====================================================

@router.get("/list")

async def get_after_sale_list(

        page:int=Query(1,ge=1),

        page_size:int=Query(10,ge=1),

        status:int|None=None,

        db:AsyncSession=Depends(get_db)

):


    result=await after_sale_crud.get_after_sale_list(

        session=db,

        page=page,

        page_size=page_size,

        status=status

    )


    return {

        "code":200,

        "message":"获取售后列表成功",

        "data":result

    }







# =====================================================
# 审核售后
# PUT /api/after-sale/audit/{id}
# =====================================================

@router.put("/audit/{after_sale_id}")

async def audit_after_sale(

        after_sale_id:int,

        data:AfterSaleAudit,

        db:AsyncSession=Depends(get_db)

):


    after_sale=await after_sale_crud.get_after_sale_by_id(

        session=db,

        after_sale_id=after_sale_id

    )



    if after_sale is None:

        raise HTTPException(

            status_code=404,

            detail="售后申请不存在"

        )





    result=await after_sale_crud.audit_after_sale(

        session=db,

        after_sale=after_sale,

        status=data.status,

        result=data.result

    )



    return {

        "code":200,

        "message":"售后审核完成",

        "data":result

    }
