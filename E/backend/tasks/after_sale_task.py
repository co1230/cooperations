from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from config.db_conf import AsyncSessionLocal
from models.after_sale import AfterSale
from models.operation_log import OperationLog

# 全局调度器（在 main.py 的 lifespan 中启动/停止）
scheduler = AsyncIOScheduler()

# 扫描间隔（秒）
SCAN_INTERVAL_SECONDS = 30


async def auto_intervene_job():
    """
    定时任务：扫描超过处理时限且仍未处理的售后单，自动标记平台介入。
    状态 0（待处理）且 deadline 已过 → 状态 1（平台已介入），并写入系统操作日志。
    """
    async with AsyncSessionLocal() as session:
        try:
            now = datetime.now()
            result = await session.execute(
                select(AfterSale).where(
                    AfterSale.status == 0,
                    AfterSale.deadline < now
                )
            )
            overdue_list = result.scalars().all()
            for item in overdue_list:
                item.status = 1
                item.is_platform_intervened = True
                item.updated_at = now
                session.add(OperationLog(
                    admin_id=0,
                    admin_name="系统",
                    action="超时自动介入",
                    target_type="after_sale",
                    target_id=item.id,
                    detail=f"售后单 {item.after_sale_no} 超过处理时限未处理，系统自动标记平台介入",
                ))
            await session.commit()
            if overdue_list:
                print(f"[售后自动介入任务] 本次自动介入 {len(overdue_list)} 个超时售后单")
        except Exception as e:
            await session.rollback()
            print(f"[售后自动介入任务] 执行失败: {e}")


def start_scheduler():
    """启动定时任务"""
    scheduler.add_job(
        auto_intervene_job,
        "interval",
        seconds=SCAN_INTERVAL_SECONDS,
        id="auto_intervene",
        replace_existing=True
    )
    scheduler.start()
    print(f"[售后自动介入任务] 已启动，每 {SCAN_INTERVAL_SECONDS} 秒扫描一次超时售后单")


def stop_scheduler():
    """停止定时任务"""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[售后自动介入任务] 已停止")
