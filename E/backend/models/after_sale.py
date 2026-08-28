from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class AfterSaleTicket(Base):
    """
    售后工单表ORM模型（对齐 A 任务 database/schema.sql 的 after_sale_tickets 表）
    平台介入规则（对齐 A 任务 mock-api.js 的 canIntervene）：
        - 强制退款 FORCE_REFUND：status ∈ (APPLIED, PROCESSING, APPROVED, REJECTED)
        - 驳回 REJECT：status ∈ (APPLIED, PROCESSING, APPROVED)
        - 两种操作均要求：未被平台处理过、订单未退款、订单履约状态 ∈ (PAID, SHIPPED, COMPLETED)、无更新的工单
    E 扩展字段：deadline（处理截止时间，超时自动介入）、is_platform_intervened、platform_intervention（平台处理记录 JSON）
    """
    __tablename__ = "after_sale_tickets"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True, comment="工单ID"
    )
    ticket_no: Mapped[str] = mapped_column(
        String(40), unique=True, nullable=False, comment="工单号"
    )
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id"), nullable=False, comment="订单ID"
    )
    order_item_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("order_items.id"), comment="订单明细ID（整单售后可为空）"
    )
    buyer_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False, comment="买家ID"
    )
    merchant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False, comment="商家ID"
    )
    ticket_type: Mapped[str] = mapped_column(
        Enum("REFUND_ONLY", "RETURN_REFUND", "EXCHANGE"),
        nullable=False, comment="工单类型：REFUND_ONLY仅退款 RETURN_REFUND退货退款 EXCHANGE换货"
    )
    status: Mapped[str] = mapped_column(
        Enum("APPLIED", "PROCESSING", "APPROVED", "REJECTED", "BUYER_SHIPPED", "REFUNDING", "COMPLETED", "CLOSED"),
        default="APPLIED", nullable=False, comment="工单状态"
    )
    reason: Mapped[str] = mapped_column(
        String(200), nullable=False, comment="申请原因"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text, comment="问题描述"
    )
    evidence_urls: Mapped[Optional[list]] = mapped_column(
        JSON, comment="凭证图片URL列表"
    )
    requested_amount: Mapped[Optional[float]] = mapped_column(
        Numeric(12, 2), comment="申请退款金额"
    )
    merchant_reply: Mapped[Optional[str]] = mapped_column(
        String(500), comment="商家回复"
    )
    deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime, comment="处理截止时间，超过则自动触发平台介入（E扩展）"
    )
    is_platform_intervened: Mapped[bool] = mapped_column(
        Boolean, default=False, comment="平台是否已介入（E扩展，含超时自动介入）"
    )
    platform_intervention: Mapped[Optional[dict]] = mapped_column(
        JSON, comment="平台处理记录（E扩展）：{decision, reason, operator_id, operator_name, created_at}"
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, comment="完成时间"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="申请时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间"
    )

    def __repr__(self):
        return f"<AfterSaleTicket(id={self.id}, ticket_no='{self.ticket_no}', status={self.status})>"
