from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# 导入所有模型
import models


from config.db_conf import init_db



# 导入路由

from routers import (
    product,
    order,
    after_sale,
    statistics
)



app = FastAPI(

    title="电商平台商家后台系统",

    description="商品管理、订单处理、售后审核、营收统计",

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
# 注册业务路由
# ===============================



# 商品管理

app.include_router(

    product.router

)



# 商家订单管理

app.include_router(

    order.router

)



# 商家售后审核

app.include_router(

    after_sale.router

)



# 商家营收统计

app.include_router(

    statistics.router

)







@app.get("/")
async def root():

    return {

        "message":

        "电商平台商家后台运行成功"

    }
