from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import admin as admin_crud
from crud import operation_log as log_crud
from models.user import User
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
    # 登录逻辑（对齐 A 任务：管理员是 users 表中 role=ADMIN 的账号，用户名或邮箱均可登录）
    # 校验账号密码 -> 校验管理员身份 -> 校验账号状态 -> 生成Token -> 记录日志
    user = await admin_crud.get_user_by_login(db, login_data.username)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise BizException("用户名或密码错误")
    if user.role != "ADMIN":
        raise BizException("该账号不是管理员账号")
    if user.account_status != "ACTIVE":
        raise BizException("该管理员账号已被禁用")
    token = create_access_token({"user_id": user.id, "role": user.role, "username": user.username})
    response_data = AdminAuthResponse(
        token=token,
        admin_info=AdminInfoResponse.model_validate(user)
    )
    await log_crud.create_log(
        db, user.id, user.username, "管理员登录",
        target_type="admin", target_id=user.id,
        detail="管理员登录系统", ip=get_client_ip(request)
    )
    return success_response(message="登录成功", data=response_data)


@router.get("/info")
async def get_admin_info(admin: User = Depends(get_current_admin)):
    return success_response(message="获取管理员信息成功", data=AdminInfoResponse.model_validate(admin))
