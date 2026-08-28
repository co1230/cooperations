from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class User(Base):
    """
    用户表ORM模型（对齐 A 任务 database/schema.sql 的 users 表）
    统一承载三种身份：BUYER 买家 / MERCHANT 商家 / ADMIN 管理员
    E 扩展字段：ban_reason、ban_until（限时封禁）、merchant_application（商家入驻申请与审核记录）
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True, comment="用户ID"
    )
    username: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="用户名"
    )
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, comment="邮箱（登录账号）"
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="密码哈希（PBKDF2，禁止明文）"
    )
    role: Mapped[str] = mapped_column(
        Enum("BUYER", "MERCHANT", "ADMIN"),
        default="BUYER", nullable=False, comment="身份：BUYER买家 MERCHANT商家 ADMIN管理员"
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(20), comment="手机号"
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500), comment="头像URL"
    )
    account_status: Mapped[str] = mapped_column(
        Enum("ACTIVE", "DISABLED", "PENDING"),
        default="ACTIVE", nullable=False, comment="账号状态：ACTIVE正常 DISABLED封禁 PENDING待审核"
    )
    ban_reason: Mapped[Optional[str]] = mapped_column(
        String(255), comment="封禁原因（E扩展）"
    )
    ban_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime, comment="封禁截止时间，NULL表示永久封禁（E扩展）"
    )
    merchant_application: Mapped[Optional[dict]] = mapped_column(
        JSON, comment="商家入驻申请与审核记录 JSON（E扩展）：{shop_name, contact, description, applied_at, review}"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间"
    )

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role={self.role}, status={self.account_status})>"
