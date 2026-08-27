from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class OperationLog(Base):
    """
    系统操作日志表ORM模型
    """
    __tablename__ = "operation_log"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="日志ID"
    )
    admin_id: Mapped[int] = mapped_column(
        Integer, default=0, comment="操作管理员ID，0表示系统自动操作"
    )
    admin_name: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="操作人名称"
    )
    action: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="操作类型"
    )
    target_type: Mapped[Optional[str]] = mapped_column(
        String(50), comment="操作对象类型"
    )
    target_id: Mapped[Optional[int]] = mapped_column(
        Integer, comment="操作对象ID"
    )
    detail: Mapped[Optional[str]] = mapped_column(
        String(500), comment="操作详情"
    )
    ip: Mapped[Optional[str]] = mapped_column(
        String(50), comment="操作IP地址"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="操作时间"
    )

    def __repr__(self):
        return f"<OperationLog(id={self.id}, admin_name='{self.admin_name}', action='{self.action}')>"
