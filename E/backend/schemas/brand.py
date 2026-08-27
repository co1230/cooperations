from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class BrandCreateRequest(BaseModel):
    """新增品牌请求"""
    name: str = Field(..., min_length=1, max_length=50, description="品牌名称")
    logo: Optional[str] = Field(None, max_length=255, description="品牌Logo图片URL")
    description: Optional[str] = Field(None, max_length=500, description="品牌描述")
    status: int = Field(1, ge=0, le=1, description="状态：1启用 0禁用")


class BrandUpdateRequest(BaseModel):
    """修改品牌请求（只更新传入的字段）"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="品牌名称")
    logo: Optional[str] = Field(None, max_length=255, description="品牌Logo图片URL")
    description: Optional[str] = Field(None, max_length=500, description="品牌描述")
    status: Optional[int] = Field(None, ge=0, le=1, description="状态：1启用 0禁用")


class BrandResponse(BaseModel):
    """品牌信息响应"""
    id: int
    name: str
    logo: Optional[str]
    description: Optional[str]
    status: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
