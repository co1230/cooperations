from datetime import datetime

from sqlalchemy import Column, Integer, String, DECIMAL, DateTime
from config.db_conf import Base


class Product(Base):
    """
    商品表

    功能：
    - 商品新增
    - 商品编辑
    - 商品删除
    - 商品上下架
    - 库存管理
    - 商品查询
    """

    __tablename__ = "product"


    # 商品ID
    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="商品ID"
    )


    # 所属类目ID
    # 对应成员E的 category.id
    category_id = Column(
        Integer,
        nullable=False,
        index=True,
        comment="商品所属类目ID"
    )


    # 所属品牌ID
    # 对应成员E的 brand.id
    brand_id = Column(
        Integer,
        nullable=False,
        index=True,
        comment="商品所属品牌ID"
    )


    # 商品名称
    name = Column(
        String(100),
        nullable=False,
        comment="商品名称"
    )


    # 商品描述
    description = Column(
        String(500),
        nullable=True,
        comment="商品描述"
    )


    # 商品价格
    price = Column(
        DECIMAL(10, 2),
        nullable=False,
        comment="商品售价"
    )


    # 商品库存
    stock = Column(
        Integer,
        nullable=False,
        default=0,
        comment="商品库存数量"
    )


    # 商品图片
    image = Column(
        String(255),
        nullable=True,
        comment="商品图片URL"
    )


    # 商品状态
    # 1 上架
    # 0 下架
    status = Column(
        Integer,
        nullable=False,
        default=1,
        comment="商品状态：1上架 0下架"
    )


    # 创建时间
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        comment="创建时间"
    )


    # 更新时间
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
        comment="更新时间"
    )
