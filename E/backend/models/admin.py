from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Admin(Base):
    """
    管理员表ORM模型
    """
    __tablename__ = "admin"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="管理员ID"
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="用户名"
    )
    password: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="密码（加密存储）"
    )
    role: Mapped[str] = mapped_column(
        String(20), default="admin", comment="角色：super 超级管理员 / admin 普通管理员"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间"
    )

    def __repr__(self):
        return f"<Admin(id={self.id}, username='{self.username}')>"
