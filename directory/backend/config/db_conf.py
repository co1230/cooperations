# backend/config/db_conf.py


from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)

from sqlalchemy.orm import declarative_base



# =====================================================
# 数据库连接配置
# =====================================================

# 修改为你的MySQL账号密码
ASYNC_DATABASE_URL = (
    "mysql+aiomysql://root:123456@localhost:3306/e_shop_admin?charset=utf8mb4"
)



# =====================================================
# 创建异步数据库引擎
# =====================================================

engine = create_async_engine(

    ASYNC_DATABASE_URL,

    echo=True

)



# =====================================================
# 创建数据库Session
# =====================================================

AsyncSessionLocal = async_sessionmaker(

    bind=engine,

    class_=AsyncSession,

    expire_on_commit=False

)



# =====================================================
# SQLAlchemy ORM基类
# 所有models继承这个Base
# =====================================================

Base = declarative_base()



# =====================================================
# 获取数据库连接
# 给crud/router使用
# =====================================================

async def get_db():

    async with AsyncSessionLocal() as session:

        yield session



# =====================================================
# 初始化数据库
# 项目启动时执行
# =====================================================

async def init_db():

    # 导入所有模型
    # 防止Base.metadata为空

    from models import (

        Admin,

        User,

        Category,

        Brand,

        Product,

        Order,

        AfterSale,

        OperationLog

    )


    async with engine.begin() as conn:


        await conn.run_sync(

            Base.metadata.create_all

        )
