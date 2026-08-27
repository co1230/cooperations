from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class Category(Base):
    """
    平台类目表ORM模型（树形结构，最多三级）
    """
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, comment="类目ID"
    )
    parent_id: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="父级类目ID，0表示顶级类目"
    )
    name: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="类目名称"
    )
    level: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False, comment="层级：1一级 2二级 3三级"
    )
    sort: Mapped[int] = mapped_column(
        Integer, default=0, comment="排序值，越小越靠前"
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
        return f"<Category(id={self.id}, name='{self.name}', level={self.level})>"
