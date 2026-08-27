from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import get_db
from crud import operation_log as log_crud
from models.admin import Admin
from schemas.operation_log import OperationLogResponse
from utils.auth import get_current_admin
from utils.response import success_response

router = APIRouter(prefix="/api/log", tags=["日志监控"])


@router.get("/list")
async def get_log_list(
        page: int = 1,
        page_size: int = 10,
        admin_name: Optional[str] = Query(None, description="操作人名称，模糊匹配"),
        action: Optional[str] = Query(None, description="操作类型"),
        start_time: Optional[datetime] = Query(None, description="开始时间"),
        end_time: Optional[datetime] = Query(None, description="结束时间"),
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    total, logs = await log_crud.get_log_list(
        db, admin_name, action, start_time, end_time, page, page_size
    )
    list_data = [OperationLogResponse.model_validate(item) for item in logs]
    return success_response(message="获取日志列表成功", data={"total": total, "list": list_data})


@router.get("/stats")
async def get_log_stats(
        admin: Admin = Depends(get_current_admin),
        db: AsyncSession = Depends(get_db)
):
    stats = await log_crud.get_log_stats(db)
    return success_response(message="获取日志统计成功", data=stats)
