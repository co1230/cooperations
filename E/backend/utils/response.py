from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder


def success_response(message: str = "success", data=None):
    """
    统一成功响应格式：{code, message, data}
    jsonable_encoder 保证 Pydantic / ORM / 字典等任意对象都能正常序列化
    """
    content = {
        "message": message,
        "data": data,
        "code": 200
    }
    return JSONResponse(content=jsonable_encoder(content))
