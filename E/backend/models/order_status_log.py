from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class OrderStatusLog(Base):
    """
    订单及售后状态变更日志表ORM模型（对齐 A 任务 database/schema.sql 的 order_status_logs 表）
    平台每次改变订单售后状态时写入一条记录，保证状态流转可追溯
    """
    __tablename__ = "order_status_logs"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True, comment="日志ID"
    )
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id"), nullable=False, comment="订单ID"
    )
    operator_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id"), comment="操作人ID（系统操作为NULL）"
    )
    status_type: Mapped[str] = mapped_column(
        Enum("ORDER", "AFTER_SALE"), nullable=False, comment="状态类型：ORDER订单状态 AFTER_SALE售后状态"
    )
    from_status: Mapped[Optional[str]] = mapped_column(
        String(30), comment="变更前状态"
    )
    to_status: Mapped[str] = mapped_column(
        String(30), nullable=False, comment="变更后状态"
    )
    remark: Mapped[Optional[str]] = mapped_column(
        String(300), comment="备注"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="变更时间"
    )

    def __repr__(self):
        return f"<OrderStatusLog(id={self.id}, order_id={self.order_id}, {self.status_type}: {self.from_status} -> {self.to_status})>"
