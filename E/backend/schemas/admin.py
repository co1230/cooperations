from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AdminLoginRequest(BaseModel):
    """管理员登录请求"""
    username: str = Field(..., min_length=1, max_length=50, description="用户名")
    password: str = Field(..., min_length=1, max_length=255, description="密码")


class AdminInfoResponse(BaseModel):
    """管理员信息响应"""
    id: int
    username: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class AdminAuthResponse(BaseModel):
    """登录成功响应：令牌 + 管理员信息"""
    token: str
    admin_info: AdminInfoResponse = Field(..., alias="adminInfo")

    model_config = ConfigDict(
        populate_by_name=True,  # alias / 字段名兼容
        from_attributes=True,
    )
