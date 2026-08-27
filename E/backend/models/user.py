from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class User(Base):
    """
    用户表ORM模型（简化版：仅包含后台管理所需字段，后续与用户组同学合并时再对齐）
    """
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="用户ID"
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="用户名"
    )
    password: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="密码（加密存储）"
    )
    nickname: Mapped[Optional[str]] = mapped_column(
        String(50), comment="昵称"
    )
    avatar: Mapped[Optional[str]] = mapped_column(
        String(255), comment="头像URL"
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(20), comment="手机号"
    )
    status: Mapped[int] = mapped_column(
        Integer, default=0, comment="账号状态：0正常 1封禁"
    )
    ban_reason: Mapped[Optional[str]] = mapped_column(
        String(255), comment="封禁原因"
    )
    ban_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime, comment="封禁截止时间，NULL表示永久封禁"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间"
    )

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', status={self.status})>"
