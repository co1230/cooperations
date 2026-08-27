from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DECIMAL,
    DateTime
)

from config.db_conf import Base



class Order(Base):

    """
    商家订单表

    功能：
    - 查看订单
    - 商家发货
    - 填写物流信息
    - 修改订单状态
    """


    __tablename__ = "orders"



    # 订单ID
    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="订单ID"
    )



    # 订单编号
    order_no = Column(
        String(50),
        nullable=False,
        unique=True,
        comment="订单编号"
    )



    # 用户ID
    user_id = Column(
        Integer,
        nullable=False,
        comment="购买用户ID"
    )



    # 商品ID
    product_id = Column(
        Integer,
        nullable=False,
        comment="商品ID"
    )



    # 商品名称
    product_name = Column(
        String(255),
        nullable=False,
        comment="商品名称"
    )



    # 商品数量
    quantity = Column(
        Integer,
        nullable=False,
        default=1,
        comment="购买数量"
    )



    # 订单金额
    total_amount = Column(
        DECIMAL(10,2),
        nullable=False,
        comment="订单金额"
    )



    # 订单状态
    #
    # 0 待付款
    # 1 待发货
    # 2 已发货
    # 3 已完成
    # 4 已退款

    status = Column(
        Integer,
        nullable=False,
        default=1,
        comment="订单状态：0待付款 1待发货 2已发货 3已完成 4已退款"
    )



    # 物流公司

    express_company = Column(
        String(100),
        nullable=True,
        comment="物流公司"
    )



    # 物流单号

    tracking_number = Column(
        String(100),
        nullable=True,
        comment="物流单号"
    )



    # 发货时间

    shipped_at = Column(
        DateTime,
        nullable=True,
        comment="发货时间"
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
