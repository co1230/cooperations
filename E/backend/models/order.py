from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Order(Base):
    """
    订单表ORM模型（对齐 A 任务 database/schema.sql 的 orders 表）
    核心设计：order_status（支付及履约主流程）与 after_sale_status（退款/退货流程）互相独立，互不覆盖
    """
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True, comment="订单ID"
    )
    order_no: Mapped[str] = mapped_column(
        String(40), unique=True, nullable=False, comment="对外订单号"
    )
    buyer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False, comment="买家ID"
    )
    merchant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False, comment="商家ID（单商家订单，便于商家隔离数据）"
    )
    total_amount: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False, comment="订单金额"
    )
    order_status: Mapped[str] = mapped_column(
        Enum("PENDING_PAYMENT", "PAID", "SHIPPED", "COMPLETED", "CANCELLED", "CLOSED"),
        default="PENDING_PAYMENT", nullable=False, comment="订单状态：支付及履约主流程"
    )
    after_sale_status: Mapped[str] = mapped_column(
        Enum("NONE", "APPLIED", "PROCESSING", "APPROVED", "REJECTED", "REFUNDING", "REFUNDED", "CLOSED"),
        default="NONE", nullable=False, comment="售后状态：退款/退货流程，与订单状态独立"
    )
    receiver_name: Mapped[str] = mapped_column(
        String(50), default="", nullable=False, comment="收货人姓名"
    )
    receiver_phone: Mapped[str] = mapped_column(
        String(20), default="", nullable=False, comment="收货人电话"
    )
    receiver_address: Mapped[str] = mapped_column(
        String(500), default="", nullable=False, comment="收货地址"
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, comment="支付时间"
    )
    shipped_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, comment="发货时间"
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, comment="完成时间"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间"
    )

    def __repr__(self):
        return f"<Order(id={self.id}, order_no='{self.order_no}', order_status={self.order_status}, after_sale_status={self.after_sale_status})>"
