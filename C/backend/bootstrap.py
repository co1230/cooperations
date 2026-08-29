from sqlalchemy import text
from sqlalchemy.engine import make_url
import aiomysql

from config import DATABASE_URL, engine
from models import Base


async def initialize_database() -> None:
    """Create the shared database and add C/E extension columns to an A-created schema."""
    url = make_url(DATABASE_URL)
    connection = await aiomysql.connect(
        host=url.host or "127.0.0.1",
        port=url.port or 3306,
        user=url.username,
        password=url.password,
        autocommit=True,
    )
    async with connection.cursor() as cursor:
        database = url.database.replace("`", "")
        await cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{database}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"
        )
    connection.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        additions = {
            "users": {
                "ban_reason": "VARCHAR(255) NULL",
                "ban_until": "DATETIME NULL",
                "merchant_application": "JSON NULL",
            },
            "products": {
                "source_product_id": "BIGINT NULL",
                "source_shop_id": "BIGINT NULL",
                "spec_key": "VARCHAR(255) NULL",
            },
            "orders": {
                "checkout_no": "VARCHAR(40) NULL",
                "original_amount": "DECIMAL(12,2) NULL",
                "discount_amount": "DECIMAL(12,2) NOT NULL DEFAULT 0",
                "express_company": "VARCHAR(100) NULL",
                "tracking_number": "VARCHAR(100) NULL",
                "expires_at": "DATETIME NULL",
            },
            "order_items": {
                "source_product_id": "BIGINT NULL",
                "cover_url": "VARCHAR(500) NULL",
            },
            "payment_records": {"request_id": "VARCHAR(80) NULL"},
            "after_sale_tickets": {
                "deadline": "DATETIME NULL",
                "is_platform_intervened": "TINYINT(1) NOT NULL DEFAULT 0",
                "platform_intervention": "JSON NULL",
            },
        }
        database = url.database
        for table, columns in additions.items():
            existing = set((await conn.execute(text(
                "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA=:schema AND TABLE_NAME=:table"
            ), {"schema": database, "table": table})).scalars())
            for column, ddl in columns.items():
                if column not in existing:
                    await conn.execute(text(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {ddl}"))

        indexes = [
            ("products", "uk_products_source_spec", "UNIQUE (`source_product_id`,`spec_key`)"),
            ("orders", "idx_orders_checkout", "(`checkout_no`)"),
            ("payment_records", "idx_payments_request", "(`request_id`)"),
        ]
        for table, index, definition in indexes:
            found = await conn.scalar(text(
                "SELECT COUNT(*) FROM information_schema.STATISTICS "
                "WHERE TABLE_SCHEMA=:schema AND TABLE_NAME=:table AND INDEX_NAME=:index"
            ), {"schema": database, "table": table, "index": index})
            if not found:
                await conn.execute(text(f"CREATE {'UNIQUE ' if definition.startswith('UNIQUE') else ''}INDEX `{index}` ON `{table}` {definition.removeprefix('UNIQUE ')}"))
