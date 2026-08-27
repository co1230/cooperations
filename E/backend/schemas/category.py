from typing import Optional

from pydantic import BaseModel, Field


class CategoryCreateRequest(BaseModel):
    """新增类目请求"""
    parent_id: int = Field(0, ge=0, description="父级类目ID，0表示顶级类目")
    name: str = Field(..., min_length=1, max_length=50, description="类目名称")
    sort: int = Field(0, ge=0, description="排序值，越小越靠前")
    status: int = Field(1, ge=0, le=1, description="状态：1启用 0禁用")


class CategoryUpdateRequest(BaseModel):
    """修改类目请求（只更新传入的字段）"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="类目名称")
    sort: Optional[int] = Field(None, ge=0, description="排序值")
    status: Optional[int] = Field(None, ge=0, le=1, description="状态：1启用 0禁用")
