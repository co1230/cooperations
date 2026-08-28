from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserBanRequest(BaseModel):
    """封禁用户请求"""
    ban_reason: str = Field(..., min_length=1, max_length=255, description="封禁原因")
    ban_duration_hours: int = Field(
        0, ge=0, description="封禁时长（小时），0表示永久封禁"
    )
    close_unpaid_orders: bool = Field(
        False, description="是否同时关闭该用户的待付款订单（已付款订单和售后单不受影响）"
    )


class UserManageResponse(BaseModel):
    """用户管理列表项响应（不含密码字段）"""
    id: int
    username: str
    email: str
    phone: Optional[str]
    avatar_url: Optional[str]
    role: str
    account_status: str
    ban_reason: Optional[str]
    ban_until: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MerchantRejectRequest(BaseModel):
    """驳回商家入驻申请请求"""
    remark: str = Field(..., min_length=1, max_length=200, description="驳回原因（1-200字）")
