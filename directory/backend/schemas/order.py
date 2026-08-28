from typing import Optional

from pydantic import BaseModel, Field



class OrderBase(BaseModel):

    order_no: str

    user_id: int

    product_id: int

    product_name: str

    quantity: int = 1

    total_amount: float

    status: int = 1



class OrderCreate(OrderBase):
    pass



class OrderShip(BaseModel):

    """
    商家发货参数
    """

    express_company: str = Field(
        ...,
        description="物流公司"
    )


    tracking_number: str = Field(
        ...,
        description="物流单号"
    )



class OrderResponse(OrderBase):

    id: int

    express_company: Optional[str]

    tracking_number: Optional[str]


    class Config:
        from_attributes = True
