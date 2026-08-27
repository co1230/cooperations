from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """根据ID查询用户"""
    return await db.get(User, user_id)


async def get_user_list(
        db: AsyncSession, keyword: Optional[str], status: Optional[int], page: int, page_size: int
) -> Tuple[int, List[User]]:
    """分页查询用户列表，支持用户名/昵称/手机号模糊搜索和状态筛选"""
    filters = []
    if keyword:
        like = f"%{keyword}%"
        filters.append(or_(
            User.username.like(like),
            User.nickname.like(like),
            User.phone.like(like),
        ))
    if status is not None:
        filters.append(User.status == status)
    total = await db.scalar(select(func.count()).select_from(User).where(*filters))
    result = await db.execute(
        select(User).where(*filters)
        .order_by(User.status.asc(), User.created_at.desc(), User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return total, list(result.scalars().all())


async def ban_user(db: AsyncSession, user: User, reason: str, duration_hours: int) -> User:
    """封禁用户，duration_hours 为 0 时永久封禁"""
    user.status = 1
    user.ban_reason = reason
    user.ban_until = datetime.now() + timedelta(hours=duration_hours) if duration_hours > 0 else None
    user.updated_at = datetime.now()
    return user


async def unban_user(db: AsyncSession, user: User) -> User:
    """解封用户"""
    user.status = 0
    user.ban_reason = None
    user.ban_until = None
    user.updated_at = datetime.now()
    return user
