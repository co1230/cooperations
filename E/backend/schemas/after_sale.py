from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AfterSaleHandleRequest(BaseModel):
    """平台处理售后工单请求：原因必填（对齐 A 任务：1-200 字平台处理原因）"""
    reason: str = Field(..., min_length=1, max_length=200, description="平台处理原因（1-200字）")


class AfterSaleListResponse(BaseModel):
    """售后工单列表项响应（含关联订单、买家信息与平台可操作标记）"""
    id: int
    ticket_no: str
    order_no: str
    product_name: Optional[str]
    buyer_name: str
    user_account_status: str
    ticket_type: str
    reason: str
    requested_amount: Optional[float]
    merchant_reply: Optional[str]
    status: str
    deadline: Optional[datetime]
    is_platform_intervened: bool
    platform_intervention: Optional[dict]
    is_overdue: bool
    can_force_refund: bool
    can_reject: bool
    created_at: datetime
