from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class AfterSale(Base):
    """
    售后单表ORM模型
    状态流转：
        0 待处理 → (超时未处理，定时任务自动触发 / 管理员手动介入) → 1 平台已介入
        1 平台已介入 → 管理员强制退款 → 2 已完成
        1 平台已介入 → 管理员关闭争议 → 3 已关闭
    """
    __tablename__ = "after_sale"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="售后单ID"
    )
    after_sale_no: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="售后单号"
    )
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("order.id"), nullable=False, comment="关联订单ID"
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user.id"), nullable=False, comment="申请用户ID"
    )
    type: Mapped[str] = mapped_column(
        Enum("return", "refund"), nullable=False, comment="售后类型：return退货 refund退款"
    )
    reason: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="申请原因"
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(500), comment="问题描述"
    )
    status: Mapped[int] = mapped_column(
        Integer, default=0, comment="状态：0待处理 1平台已介入 2已完成(已退款) 3已关闭(争议关闭)"
    )
    deadline: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, comment="处理截止时间，超过则自动触发平台介入"
    )
    is_platform_intervened: Mapped[bool] = mapped_column(
        Boolean, default=False, comment="平台是否已介入"
    )
    result: Mapped[Optional[str]] = mapped_column(
        String(255), comment="处理结果说明"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="申请时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间"
    )

    def __repr__(self):
        return f"<AfterSale(id={self.id}, after_sale_no='{self.after_sale_no}', status={self.status})>"
