from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AfterSaleHandleRequest(BaseModel):
    """售后处理请求（强制退款 / 关闭争议时可选传入处理结果说明）"""
    result: Optional[str] = Field(None, max_length=255, description="处理结果说明")


class AfterSaleListResponse(BaseModel):
    """售后单列表项响应（含关联订单、用户信息）"""
    id: int
    after_sale_no: str
    order_no: str
    product_name: str
    username: str
    user_status: int
    type: str
    reason: str
    status: int
    deadline: datetime
    is_platform_intervened: bool
    is_overdue: bool
    result: Optional[str]
    created_at: datetime
