from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(Enum("BUYER", "MERCHANT", "ADMIN"), nullable=False, default="BUYER")
    phone: Mapped[str | None] = mapped_column(String(20))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    account_status: Mapped[str] = mapped_column(Enum("ACTIVE", "DISABLED", "PENDING"), nullable=False, default="ACTIVE")
    ban_reason: Mapped[str | None] = mapped_column(String(255))
    ban_until: Mapped[datetime | None] = mapped_column(DateTime)
    merchant_application: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class Product(Base):
    """B 商品规格在交易库中的服务端快照；每个规格组合是一条可售记录。"""

    __tablename__ = "products"
    __table_args__ = (UniqueConstraint("source_product_id", "spec_key", name="uk_products_source_spec"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    merchant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    sku: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cover_url: Mapped[str | None] = mapped_column(String(500))
    product_status: Mapped[str] = mapped_column(Enum("DRAFT", "ON_SALE", "OFF_SALE"), nullable=False, default="ON_SALE")
    source_product_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    source_shop_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    spec_key: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class ShoppingCart(Base):
    __tablename__ = "shopping_carts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    buyer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("cart_id", "product_id", name="uk_cart_product"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    cart_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("shopping_carts.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    selected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_no: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    checkout_no: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    buyer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    merchant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    original_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    order_status: Mapped[str] = mapped_column(Enum("PENDING_PAYMENT", "PAID", "SHIPPED", "COMPLETED", "CANCELLED", "CLOSED"), nullable=False, default="PENDING_PAYMENT")
    after_sale_status: Mapped[str] = mapped_column(Enum("NONE", "APPLIED", "PROCESSING", "APPROVED", "REJECTED", "REFUNDING", "REFUNDED", "CLOSED"), nullable=False, default="NONE")
    receiver_name: Mapped[str] = mapped_column(String(50), nullable=False)
    receiver_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    receiver_address: Mapped[str] = mapped_column(String(500), nullable=False)
    express_company: Mapped[str | None] = mapped_column(String(100))
    tracking_number: Mapped[str | None] = mapped_column(String(100))
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(160), nullable=False)
    source_product_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    cover_url: Mapped[str | None] = mapped_column(String(500))
    sku: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)


class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    payment_no: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    request_id: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id"), nullable=False, index=True)
    buyer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(Enum("ALIPAY", "WECHAT", "BANK_CARD", "MOCK"), nullable=False)
    payment_status: Mapped[str] = mapped_column(Enum("PENDING", "SUCCESS", "FAILED", "REFUNDED"), nullable=False, default="PENDING")
    third_party_trade_no: Mapped[str | None] = mapped_column(String(100))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class AfterSaleTicket(Base):
    __tablename__ = "after_sale_tickets"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ticket_no: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id"), nullable=False, index=True)
    order_item_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("order_items.id"))
    buyer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    merchant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    ticket_type: Mapped[str] = mapped_column(Enum("REFUND_ONLY", "RETURN_REFUND", "EXCHANGE"), nullable=False)
    status: Mapped[str] = mapped_column(Enum("APPLIED", "PROCESSING", "APPROVED", "REJECTED", "BUYER_SHIPPED", "REFUNDING", "COMPLETED", "CLOSED"), nullable=False, default="APPLIED")
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    evidence_urls: Mapped[list | None] = mapped_column(JSON)
    requested_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    merchant_reply: Mapped[str | None] = mapped_column(String(500))
    deadline: Mapped[datetime | None] = mapped_column(DateTime)
    is_platform_intervened: Mapped[bool] = mapped_column(Boolean, default=False)
    platform_intervention: Mapped[dict | None] = mapped_column(JSON)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class OrderStatusLog(Base):
    __tablename__ = "order_status_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id"), nullable=False, index=True)
    operator_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    status_type: Mapped[str] = mapped_column(Enum("ORDER", "AFTER_SALE"), nullable=False)
    from_status: Mapped[str | None] = mapped_column(String(30))
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    remark: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"
    __table_args__ = (UniqueConstraint("scope", "user_id", "request_id", name="uk_idempotency_scope_user_request"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    scope: Mapped[str] = mapped_column(String(30), nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    request_id: Mapped[str] = mapped_column(String(80), nullable=False)
    response_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
