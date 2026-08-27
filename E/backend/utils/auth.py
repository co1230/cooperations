from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from config.db_conf import get_db
from crud import admin as admin_crud
from models.admin import Admin

SECRET_KEY = "e-shop-admin-secret-key-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 令牌有效期：24小时


def create_access_token(data: dict) -> str:
    """生成 JWT 令牌"""
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """解析 JWT 令牌，失败返回 None"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None


async def get_current_admin(
        authorization: Optional[str] = Header(None),
        db: AsyncSession = Depends(get_db)
) -> Admin:
    """依赖项：校验请求头中的 Bearer Token，返回当前登录管理员"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未登录，请先登录")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已过期，请重新登录")
    admin = await admin_crud.get_admin_by_id(db, payload.get("admin_id"))
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="管理员账号不存在")
    return admin


def get_client_ip(request: Request) -> str:
    """获取请求方 IP 地址"""
    return request.client.host if request.client else "unknown"
