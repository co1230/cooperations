from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime
)

from config.db_conf import Base



class AfterSale(Base):

    """
    售后申请表

    功能：
    - 查看售后申请
    - 审核退款
    - 同意退款
    - 拒绝退款
    """

    __tablename__ = "after_sale"



    # 售后ID

    id = Column(

        Integer,

        primary_key=True,

        autoincrement=True,

        comment="售后ID"

    )



    # 售后编号

    after_sale_no = Column(

        String(50),

        nullable=False,

        unique=True,

        comment="售后编号"

    )



    # 订单ID

    order_id = Column(

        Integer,

        nullable=False,

        comment="关联订单ID"

    )



    # 用户ID

    user_id = Column(

        Integer,

        nullable=False,

        comment="申请用户ID"

    )



    # 售后类型

    # refund 退款

    # return 退货

    type = Column(

        String(20),

        nullable=False,

        comment="售后类型"

    )



    # 申请原因

    reason = Column(

        String(255),

        nullable=False,

        comment="申请原因"

    )



    # 问题描述

    description = Column(

        String(500),

        nullable=True,

        comment="问题描述"

    )



    # 状态

    # 0 待审核

    # 1 同意退款

    # 2 拒绝退款

    # 3 已完成

    status = Column(

        Integer,

        nullable=False,

        default=0,

        comment="售后状态"

    )



    # 审核结果

    result = Column(

        String(255),

        nullable=True,

        comment="审核结果"

    )



    # 创建时间

    created_at = Column(

        DateTime,

        nullable=False,

        default=datetime.now,

        comment="申请时间"

    )



    # 更新时间

    updated_at = Column(

        DateTime,

        nullable=False,

        default=datetime.now,

        onupdate=datetime.now,

        comment="更新时间"

    )
