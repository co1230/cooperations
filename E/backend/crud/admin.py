from typing import Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User


async def get_user_by_login(db: AsyncSession, login: str) -> Optional[User]:
    """根据用户名或邮箱查询用户（对齐 A 任务：邮箱为登录账号）"""
    result = await db.execute(
        select(User).where(or_(User.username == login, User.email == login))
    )
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """根据ID查询用户"""
    return await db.get(User, user_id)
