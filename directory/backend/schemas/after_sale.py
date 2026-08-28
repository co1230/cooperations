from typing import Optional

from datetime import datetime

from pydantic import BaseModel, Field





class AfterSaleBase(BaseModel):


    order_id:int = Field(

        ...,

        description="订单ID"

    )


    user_id:int = Field(

        ...,

        description="用户ID"

    )


    type:str = Field(

        ...,

        description="售后类型"

    )


    reason:str = Field(

        ...,

        description="申请原因"

    )


    description:Optional[str]=None





# 创建售后

class AfterSaleCreate(AfterSaleBase):

    pass






# 商家审核

class AfterSaleAudit(BaseModel):


    status:int = Field(

        ...,

        description="审核状态 1同意 2拒绝"

    )


    result:Optional[str]=None







# 返回数据

class AfterSaleResponse(AfterSaleBase):


    id:int


    after_sale_no:str


    status:int


    result:Optional[str]


    created_at:datetime


    updated_at:datetime



    class Config:

        from_attributes=True
