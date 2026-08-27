from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.operation_log import OperationLog


async def create_log(
        db: AsyncSession,
        admin_id: int,
        admin_name: str,
        action: str,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        detail: Optional[str] = None,
        ip: Optional[str] = None,
) -> OperationLog:
    """写入操作日志"""
    log = OperationLog(
        admin_id=admin_id,
        admin_name=admin_name,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
        ip=ip,
    )
    db.add(log)
    await db.flush()
    return log


async def get_log_list(
        db: AsyncSession,
        admin_name: Optional[str],
        action: Optional[str],
        start_time: Optional[datetime],
        end_time: Optional[datetime],
        page: int,
        page_size: int,
) -> Tuple[int, List[OperationLog]]:
    """分页查询操作日志，支持操作人/操作类型/时间范围筛选"""
    filters = []
    if admin_name:
        filters.append(OperationLog.admin_name.like(f"%{admin_name}%"))
    if action:
        filters.append(OperationLog.action == action)
    if start_time:
        filters.append(OperationLog.created_at >= start_time)
    if end_time:
        filters.append(OperationLog.created_at <= end_time)
    total = await db.scalar(select(func.count()).select_from(OperationLog).where(*filters))
    result = await db.execute(
        select(OperationLog).where(*filters)
        .order_by(OperationLog.created_at.desc(), OperationLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return total, list(result.scalars().all())


async def get_log_stats(db: AsyncSession) -> dict:
    """日志统计：今日操作次数 + 累计操作次数"""
    today_start = datetime.combine(datetime.now().date(), datetime.min.time())
    today_count = await db.scalar(
        select(func.count()).select_from(OperationLog).where(OperationLog.created_at >= today_start)
    )
    total_count = await db.scalar(select(func.count()).select_from(OperationLog))
    return {"today_count": today_count or 0, "total_count": total_count or 0}
