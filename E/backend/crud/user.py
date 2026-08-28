from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.order import Order
from models.user import User


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """根据ID查询用户"""
    return await db.get(User, user_id)


async def get_user_list(
        db: AsyncSession,
        keyword: Optional[str],
        role: Optional[str],
        account_status: Optional[str],
        page: int,
        page_size: int,
) -> Tuple[int, List[User]]:
    """分页查询用户列表，支持用户名/邮箱/手机号模糊搜索、角色与状态筛选"""
    filters = []
    if keyword:
        like = f"%{keyword}%"
        filters.append(or_(
            User.username.like(like),
            User.email.like(like),
            User.phone.like(like),
        ))
    if role:
        filters.append(User.role == role)
    if account_status:
        filters.append(User.account_status == account_status)
    total = await db.scalar(select(func.count()).select_from(User).where(*filters))
    result = await db.execute(
        select(User).where(*filters)
        .order_by(User.account_status.asc(), User.created_at.desc(), User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return total, list(result.scalars().all())


async def ban_user(db: AsyncSession, user: User, reason: str, duration_hours: int) -> User:
    """封禁用户（对齐 A 任务：account_status → DISABLED），duration_hours 为 0 时永久封禁"""
    user.account_status = "DISABLED"
    user.ban_reason = reason
    user.ban_until = datetime.now() + timedelta(hours=duration_hours) if duration_hours > 0 else None
    user.updated_at = datetime.now()
    return user


async def unban_user(db: AsyncSession, user: User) -> User:
    """解封用户（对齐 A 任务：account_status → ACTIVE）"""
    user.account_status = "ACTIVE"
    user.ban_reason = None
    user.ban_until = None
    user.updated_at = datetime.now()
    return user


async def close_unpaid_orders(db: AsyncSession, user: User) -> int:
    """关闭用户的待付款订单（PENDING_PAYMENT → CLOSED），返回关闭数量"""
    result = await db.execute(
        update(Order)
        .where(Order.buyer_id == user.id, Order.order_status == "PENDING_PAYMENT")
        .values(order_status="CLOSED", updated_at=datetime.now())
    )
    return result.rowcount or 0


async def get_merchant_applications(
        db: AsyncSession, account_status: Optional[str], page: int, page_size: int
) -> Tuple[int, List[User]]:
    """查询商家入驻申请列表（默认仅待审核）"""
    filters = [User.role == "MERCHANT"]
    if account_status:
        filters.append(User.account_status == account_status)
    total = await db.scalar(select(func.count()).select_from(User).where(*filters))
    result = await db.execute(
        select(User).where(*filters)
        .order_by(User.created_at.asc(), User.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return total, list(result.scalars().all())


async def approve_merchant(db: AsyncSession, user: User, operator: User) -> User:
    """通过商家入驻申请：开通商家登录（account_status → ACTIVE），记录审核结果"""
    # 注意：JSON 列必须赋值新字典对象，原地修改同一引用不会被 SQLAlchemy 检测为变更
    application = dict(user.merchant_application or {})
    application["review"] = {
        "result": "APPROVED",
        "remark": "审核通过",
        "operator_id": operator.id,
        "operator_name": operator.username,
        "reviewed_at": datetime.now().isoformat(),
    }
    user.account_status = "ACTIVE"
    user.merchant_application = application
    user.updated_at = datetime.now()
    return user


async def reject_merchant(db: AsyncSession, user: User, operator: User, remark: str) -> User:
    """驳回商家入驻申请：保持待审核状态，记录驳回原因（拒绝后不可登录，不可重复审核）"""
    # 注意：JSON 列必须赋值新字典对象，原地修改同一引用不会被 SQLAlchemy 检测为变更
    application = dict(user.merchant_application or {})
    application["review"] = {
        "result": "REJECTED",
        "remark": remark,
        "operator_id": operator.id,
        "operator_name": operator.username,
        "reviewed_at": datetime.now().isoformat(),
    }
    user.merchant_application = application
    user.updated_at = datetime.now()
    return user
