from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class PaymentRecord(Base):
    """
    支付流水表ORM模型（对齐 A 任务 database/schema.sql 的 payment_records 表）
    平台强制退款时：全额退款将订单下 SUCCESS 流水同步为 REFUNDED
    """
    __tablename__ = "payment_records"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True, comment="流水ID"
    )
    payment_no: Mapped[str] = mapped_column(
        String(40), unique=True, nullable=False, comment="支付流水号"
    )
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id"), nullable=False, comment="订单ID"
    )
    buyer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False, comment="买家ID"
    )
    amount: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False, comment="支付金额"
    )
    payment_method: Mapped[str] = mapped_column(
        Enum("ALIPAY", "WECHAT", "BANK_CARD", "MOCK"),
        nullable=False, comment="支付方式：MOCK为模拟支付"
    )
    payment_status: Mapped[str] = mapped_column(
        Enum("PENDING", "SUCCESS", "FAILED", "REFUNDED"),
        default="PENDING", nullable=False, comment="流水状态"
    )
    third_party_trade_no: Mapped[Optional[str]] = mapped_column(
        String(100), comment="第三方交易号"
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, comment="支付时间"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="创建时间"
    )

    def __repr__(self):
        return f"<PaymentRecord(id={self.id}, payment_no='{self.payment_no}', status={self.payment_status})>"
