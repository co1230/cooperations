from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Order(Base):
    """
    订单表ORM模型（简化版：仅包含售后模块所需字段，后续与订单组同学合并时再对齐）
    注：order 为 MySQL 保留字，表名在生成 SQL 时会自动加反引号
    """
    __tablename__ = "order"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="订单ID"
    )
    order_no: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="订单号"
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user.id"), nullable=False, comment="下单用户ID"
    )
    product_name: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="商品名称（简化）"
    )
    total_amount: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, comment="订单金额"
    )
    status: Mapped[int] = mapped_column(
        Integer, default=1, comment="订单状态：0待付款 1已付款 2已发货 3已完成 4已退款 5已关闭"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间"
    )

    def __repr__(self):
        return f"<Order(id={self.id}, order_no='{self.order_no}')>"
