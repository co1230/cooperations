from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401 确保所有 ORM 模型注册到 Base.metadata

from config.db_conf import AsyncSessionLocal, init_db

from crud import admin as admin_crud

from routers import (
    after_sale,
    auth,
    brand,
    category,
    logs,
    user_manage,
    product       # ⭐新增商品模块
)

from tasks.after_sale_task import start_scheduler, stop_scheduler

from utils.exception_handlers import register_exception_handlers
from utils.security import hash_password



async def seed_admin():
    """
    预置默认管理员账号：admin / 123456
    不存在时自动创建
    """

    async with AsyncSessionLocal() as session:
        try:

            existing = await admin_crud.get_admin_by_username(
                session,
                "admin"
            )

            if not existing:

                await admin_crud.create_admin(
                    session,
                    "admin",
                    hash_password("123456"),
                    "super"
                )

                await session.commit()

                print("已创建默认管理员账号: admin / 123456")


        except Exception as e:

            await session.rollback()

            print(
                f"初始化默认管理员失败: {e}"
            )



@asynccontextmanager
async def lifespan(app: FastAPI):

    # ==============================
    # 启动阶段
    # ==============================

    # 自动创建数据库表
    await init_db()


    # 创建默认管理员
    await seed_admin()


    # 启动售后超时自动介入任务
    start_scheduler()


    yield


    # ==============================
    # 关闭阶段
    # ==============================

    stop_scheduler()



app = FastAPI(
    title="电商平台 - 管理员后台系统",
    description="类目/品牌管理、商品管理、用户封禁、平台介入售后、系统日志监控",
    lifespan=lifespan
)



# ==============================
# 异常处理
# ==============================

register_exception_handlers(app)



# ==============================
# 跨域配置
# ==============================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)



# ==============================
# 首页
# ==============================

@app.get("/")
async def root():

    return {
        "message": "电商平台-管理员后台系统",
        "docs": "/docs"
    }



# ==============================
# 注册路由
# ==============================

app.include_router(auth.router)

app.include_router(category.router)

app.include_router(brand.router)

app.include_router(user_manage.router)

app.include_router(after_sale.router)

app.include_router(logs.router)


# ⭐⭐⭐ 成员D新增商品管理接口

app.include_router(product.router)
