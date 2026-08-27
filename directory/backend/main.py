from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models

from config.db_conf import init_db

from routers import product


app = FastAPI(
    title="电商平台商品管理系统",
    description="商品增删改查管理",
    version="1.0.0"
)


# ===============================
# 跨域配置
# ===============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ===============================
# 启动初始化数据库
# ===============================

@app.on_event("startup")
async def startup():

    await init_db()



# ===============================
# 注册商品路由
# ===============================

app.include_router(
    product.router
)



@app.get("/")
async def root():

    return {
        "message": "商品管理后台运行成功"
    }
