from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class OperationLogResponse(BaseModel):
    """操作日志响应"""
    id: int
    admin_id: int
    admin_name: str
    action: str
    target_type: Optional[str]
    target_id: Optional[int]
    detail: Optional[str]
    ip: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
