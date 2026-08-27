from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from utils.exception import BizException


def register_exception_handlers(app: FastAPI):
    """注册全局异常处理器"""

    @app.exception_handler(BizException)
    async def biz_exception_handler(request: Request, exc: BizException):
        # 业务异常：HTTP 200 返回，code 非 200 由前端拦截器统一提示
        return JSONResponse(
            status_code=200,
            content={"code": exc.code, "message": exc.message, "data": None}
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        # HTTP 异常（如 401 未登录）：保留真实状态码，前端据此跳转登录页
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.status_code, "message": str(exc.detail), "data": None}
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        # 兜底异常
        return JSONResponse(
            status_code=200,
            content={"code": 500, "message": f"服务器内部错误：{exc}", "data": None}
        )
