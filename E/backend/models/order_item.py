from sqlalchemy import BigInteger, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class OrderItem(Base):
    """
    订单明细表ORM模型（对齐 A 任务 database/schema.sql 的 order_items 表）
    E 仅用于售后列表展示商品名称快照，商品/订单的写入由商家端负责
    """
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True, comment="明细ID"
    )
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("orders.id"), nullable=False, comment="订单ID"
    )
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id"), nullable=False, comment="商品ID"
    )
    product_name: Mapped[str] = mapped_column(
        String(160), nullable=False, comment="下单时商品名称快照"
    )
    sku: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="下单时 SKU 快照"
    )
    unit_price: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False, comment="下单时单价快照"
    )
    quantity: Mapped[int] = mapped_column(
        Integer, nullable=False, comment="数量"
    )
    subtotal: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False, comment="小计"
    )

    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_name='{self.product_name}')>"
