from fastapi import APIRouter, Depends


from sqlalchemy.ext.asyncio import AsyncSession


from config.db_conf import get_db


from crud import statistics as statistics_crud



router = APIRouter(


    prefix="/api/statistics",


    tags=["营收统计"]

)






# ==================================================
# 获取营收统计
#
# GET /api/statistics/summary
#
# ==================================================

@router.get("/summary")


async def get_statistics(


        db:AsyncSession=Depends(get_db)

):



    result = await statistics_crud.get_statistics(

        session=db

    )



    return {


        "code":200,


        "message":"获取营收统计成功",


        "data":result


    }
