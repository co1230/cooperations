from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.admin import Admin


async def get_admin_by_username(db: AsyncSession, username: str) -> Optional[Admin]:
    """根据用户名查询管理员"""
    result = await db.execute(select(Admin).where(Admin.username == username))
    return result.scalars().first()


async def get_admin_by_id(db: AsyncSession, admin_id: int) -> Optional[Admin]:
    """根据ID查询管理员"""
    return await db.get(Admin, admin_id)


async def create_admin(db: AsyncSession, username: str, password: str, role: str = "admin") -> Admin:
    """创建管理员"""
    admin = Admin(username=username, password=password, role=role)
    db.add(admin)
    await db.flush()
    return admin
