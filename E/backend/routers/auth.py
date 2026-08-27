from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import admin as admin_crud
from crud import operation_log as log_crud
from models.admin import Admin
from schemas.admin import AdminAuthResponse, AdminInfoResponse, AdminLoginRequest
from utils.auth import create_access_token, get_client_ip, get_current_admin
from utils.exception import BizException
from utils.response import success_response
from utils.security import verify_password

router = APIRouter(prefix="/api/admin", tags=["管理员认证"])


@router.post("/login")
async def login(
        login_data: AdminLoginRequest,
        request: Request,
        db: AsyncSession = Depends(get_db)
):
    # 登录逻辑：验证账号密码 -> 生成Token -> 记录日志 -> 响应结果
    admin = await admin_crud.get_admin_by_username(db, login_data.username)
    if not admin or not verify_password(login_data.password, admin.password):
        raise BizException("用户名或密码错误")
    token = create_access_token({"admin_id": admin.id, "username": admin.username})
    response_data = AdminAuthResponse(
        token=token,
        admin_info=AdminInfoResponse.model_validate(admin)
    )
    await log_crud.create_log(
        db, admin.id, admin.username, "管理员登录",
        target_type="admin", target_id=admin.id,
        detail="管理员登录系统", ip=get_client_ip(request)
    )
    return success_response(message="登录成功", data=response_data)


@router.get("/info")
async def get_admin_info(admin: Admin = Depends(get_current_admin)):
    return success_response(message="获取管理员信息成功", data=AdminInfoResponse.model_validate(admin))
