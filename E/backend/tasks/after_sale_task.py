from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from config.db_conf import AsyncSessionLocal
from models.after_sale import AfterSaleTicket
from models.operation_log import OperationLog
from models.order import Order
from models.order_status_log import OrderStatusLog
from models.user import User

# 全局调度器（在 main.py 的 lifespan 中启动/停止）
scheduler = AsyncIOScheduler()

# 扫描间隔（秒）
SCAN_INTERVAL_SECONDS = 30


async def auto_intervene_job():
    """
    定时任务：扫描超过处理时限且仍未处理的售后工单，自动标记平台介入。
    状态 APPLIED（待审核）且 deadline 已过 → PROCESSING（处理中），同步订单售后状态，
    写入系统操作日志和订单售后状态变更日志。
    """
    async with AsyncSessionLocal() as session:
        try:
            now = datetime.now()
            result = await session.execute(
                select(AfterSaleTicket).where(
                    AfterSaleTicket.status == "APPLIED",
                    AfterSaleTicket.deadline.isnot(None),
                    AfterSaleTicket.deadline < now
                )
            )
            overdue_list = result.scalars().all()
            for ticket in overdue_list:
                order = await session.get(Order, ticket.order_id)
                previous = order.after_sale_status if order else "NONE"
                ticket.status = "PROCESSING"
                ticket.is_platform_intervened = True
                ticket.updated_at = now
                if order:
                    order.after_sale_status = "PROCESSING"
                    order.updated_at = now
                session.add(OrderStatusLog(
                    order_id=ticket.order_id, operator_id=None, status_type="AFTER_SALE",
                    from_status=previous, to_status="PROCESSING", remark="超时未处理，系统自动介入",
                ))
                session.add(OperationLog(
                    admin_id=0,
                    admin_name="系统",
                    action="超时自动介入",
                    target_type="after_sale",
                    target_id=ticket.id,
                    detail=f"售后工单 {ticket.ticket_no} 超过处理时限未处理，系统自动标记平台介入",
                ))
            await session.commit()
            if overdue_list:
                print(f"[售后自动介入任务] 本次自动介入 {len(overdue_list)} 个超时售后工单")
        except Exception as e:
            await session.rollback()
            print(f"[售后自动介入任务] 执行失败: {e}")


async def auto_unban_job():
    """
    定时任务：扫描封禁时长到期（非永久封禁）的用户，自动解封。
    状态 DISABLED（封禁）且 ban_until 已过 → ACTIVE（正常），清空封禁字段，并写入系统操作日志。
    """
    async with AsyncSessionLocal() as session:
        try:
            now = datetime.now()
            result = await session.execute(
                select(User).where(
                    User.account_status == "DISABLED",
                    User.ban_until.isnot(None),
                    User.ban_until < now,
                    User.role != "ADMIN",
                )
            )
            expired_list = result.scalars().all()
            for user in expired_list:
                user.account_status = "ACTIVE"
                user.ban_reason = None
                user.ban_until = None
                user.updated_at = now
                session.add(OperationLog(
                    admin_id=0,
                    admin_name="系统",
                    action="封禁到期自动解封",
                    target_type="user",
                    target_id=user.id,
                    detail=f"用户 {user.username} 封禁时长到期，系统自动解封",
                ))
            await session.commit()
            if expired_list:
                print(f"[封禁自动解封任务] 本次自动解封 {len(expired_list)} 个用户")
        except Exception as e:
            await session.rollback()
            print(f"[封禁自动解封任务] 执行失败: {e}")


def start_scheduler():
    """启动定时任务"""
    scheduler.add_job(
        auto_intervene_job,
        "interval",
        seconds=SCAN_INTERVAL_SECONDS,
        id="auto_intervene",
        replace_existing=True
    )
    scheduler.add_job(
        auto_unban_job,
        "interval",
        seconds=SCAN_INTERVAL_SECONDS,
        id="auto_unban",
        replace_existing=True
    )
    scheduler.start()
    print(f"[定时任务] 已启动，每 {SCAN_INTERVAL_SECONDS} 秒扫描一次超时售后工单和到期封禁用户")


def stop_scheduler():
    """停止定时任务"""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[定时任务] 已停止")
