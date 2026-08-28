from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401  确保所有 ORM 模型注册到 Base.metadata
from config.db_conf import AsyncSessionLocal, init_db
from crud import admin as admin_crud
from routers import after_sale, auth, brand, category, logs, user_manage
from tasks.after_sale_task import start_scheduler, stop_scheduler
from utils.exception_handlers import register_exception_handlers
from utils.security import hash_password


async def seed_admin():
    """预置默认管理员（users 表中 role=ADMIN）：admin / admin@demo.com / 123456（不存在时自动创建）"""
    async with AsyncSessionLocal() as session:
        try:
            existing = await admin_crud.get_user_by_login(session, "admin@demo.com")
            if not existing:
                from models.user import User
                session.add(User(
                    username="admin",
                    email="admin@demo.com",
                    password_hash=hash_password("123456"),
                    role="ADMIN",
                    account_status="ACTIVE",
                ))
                await session.commit()
                print("已创建默认管理员账号: admin / admin@demo.com / 123456")
        except Exception as e:
            await session.rollback()
            print(f"初始化默认管理员失败: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时：自动建表（表不存在时） -> 预置管理员 -> 启动定时任务
    await init_db()
    await seed_admin()
    start_scheduler()
    yield
    # 关闭时：停止定时任务
    stop_scheduler()


app = FastAPI(
    title="电商平台 - 管理员后台系统",
    description="类目/品牌管理、用户封禁、商家审核、平台介入售后、系统日志监控（数据库对齐团队 ecommerce 库）",
    lifespan=lifespan
)

# 注册异常处理器
register_exception_handlers(app)

# 跨域配置（开发阶段允许所有源）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "电商平台-管理员后台系统", "docs": "/docs"}


# 挂载路由/注册路由
app.include_router(auth.router)
app.include_router(category.router)
app.include_router(brand.router)
app.include_router(user_manage.router)
app.include_router(user_manage.merchant_router)
app.include_router(after_sale.router)
app.include_router(logs.router)
