from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Brand(Base):
    """
    品牌表ORM模型
    """
    __tablename__ = "brand"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="品牌ID"
    )
    name: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, comment="品牌名称"
    )
    logo: Mapped[Optional[str]] = mapped_column(
        String(255), comment="品牌Logo图片URL"
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(500), comment="品牌描述"
    )
    status: Mapped[int] = mapped_column(
        Integer, default=1, comment="状态：1启用 0禁用"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间"
    )

    def __repr__(self):
        return f"<Brand(id={self.id}, name='{self.name}')>"
