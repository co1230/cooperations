from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession, create_async_engine

# 数据库连接地址（对齐 A 任务：团队共用 ecommerce 库；请根据本地 MySQL 配置修改用户名和密码）
ASYNC_DATABASE_URL = "mysql+aiomysql://root:123456@localhost:3306/ecommerce?charset=utf8mb4"

# 创建异步引擎
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,       # 是否输出SQL日志
    pool_size=10,     # 连接池中保持的持久连接数
    max_overflow=20   # 连接池允许创建的额外连接数
)

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# 依赖项：获取数据库会话
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# 初始化数据库：根据 ORM 模型自动创建数据表（表不存在时才创建）
async def init_db():
    from models import Base
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
