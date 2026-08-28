# 数据库建表 SQL 文档

> 项目：`E`（电商平台 - 管理员后台系统）
> 数据库：MySQL 8.x，库名 **`ecommerce`**（与团队 A 任务 `database/schema.sql` 共用同一库）
> 完整脚本位置：`E/backend/sql/init.sql`（可直接执行，可重复执行不破坏数据）

---

## 一、数据库信息

| 项目 | 说明 |
|---|---|
| 库名 | `ecommerce`（团队统一库，对齐 A 任务） |
| 字符集 | utf8mb4 |
| 排序规则 | utf8mb4_0900_ai_ci |
| 存储引擎 | InnoDB |
| ORM 对应 | 后端 `backend/models/` 下的 SQLAlchemy 模型与下表一一对应 |

**两种建表方式（二选一即可，也可都执行）：**

1. **手动执行**：在 MySQL 客户端执行 `backend/sql/init.sql`
2. **自动建表**：直接启动后端，`main.py` 启动时自动执行 `Base.metadata.create_all`，并自动创建默认管理员 `admin / admin@demo.com / 123456`

---

## 二、表设计说明（共 10 张表）

### 2.1 与 A 任务对齐的表（7 张，团队共用结构）

| 表 | 说明 | 归属 |
|---|---|---|
| users | 用户表（BUYER/MERCHANT/ADMIN 三种身份） | 团队共用，E 负责管理端读写 |
| products | 商品表 | 商家端维护，E 仅建表保证外键完整性 |
| orders | 订单表（订单状态与售后状态独立建模） | 团队共用，E 负责平台介入时的售后状态变更 |
| order_items | 订单明细表 | 团队共用，E 用于售后列表展示商品名称快照 |
| after_sale_tickets | 售后工单表 | 团队共用，E 负责平台介入 |
| payment_records | 支付流水表 | 团队共用，E 强制退款时同步流水状态 |
| order_status_logs | 订单及售后状态变更日志 | 团队共用，E 每次状态变更写日志 |

### 2.2 E 自有表（3 张，平台管理功能）

| 表 | 说明 |
|---|---|
| category | 平台类目表（树形，最多三级） |
| brand | 品牌表 |
| operation_log | 系统操作日志表（管理员审计，独立于订单状态日志） |

---

## 三、各表字段说明

### 3.1 users - 用户表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | BIGINT UNSIGNED | 主键，自增 | 用户ID |
| username | VARCHAR(50) | 非空 | 用户名 |
| email | VARCHAR(120) | 非空，唯一 | 邮箱（登录账号） |
| password_hash | VARCHAR(255) | 非空 | 密码哈希（PBKDF2，禁止明文） |
| role | ENUM('BUYER','MERCHANT','ADMIN') | 非空，默认 BUYER | 身份 |
| phone | VARCHAR(20) | 可空 | 手机号 |
| avatar_url | VARCHAR(500) | 可空 | 头像URL |
| account_status | ENUM('ACTIVE','DISABLED','PENDING') | 非空，默认 ACTIVE | 账号状态 |
| ban_reason | VARCHAR(255) | 可空 | 封禁原因（**E扩展**） |
| ban_until | DATETIME | 可空 | 封禁截止时间，NULL=永久（**E扩展**） |
| merchant_application | JSON | 可空 | 商家入驻申请与审核记录（**E扩展**） |
| created_at / updated_at | DATETIME | 非空 | 时间戳 |

`merchant_application` JSON 结构：

```json
{
  "shop_name": "山茶手作",
  "contact": "李雷",
  "description": "主营手作陶瓷与茶具",
  "applied_at": "2026-08-20T10:00:00",
  "review": null
}
```

审核后 `review` 变为：`{"result": "APPROVED"|"REJECTED", "remark": "...", "operator_id": 1, "operator_name": "admin", "reviewed_at": "..."}`

### 3.2 orders - 订单表（核心设计：双状态独立）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | BIGINT UNSIGNED | 主键，自增 | 订单ID |
| order_no | VARCHAR(40) | 非空，唯一 | 对外订单号 |
| buyer_id | BIGINT UNSIGNED | 非空，外键 → users.id | 买家ID |
| merchant_id | BIGINT UNSIGNED | 非空，外键 → users.id | 商家ID（单商家订单） |
| total_amount | DECIMAL(12,2) | 非空 | 订单金额 |
| order_status | ENUM('PENDING_PAYMENT','PAID','SHIPPED','COMPLETED','CANCELLED','CLOSED') | 非空 | **订单状态：支付及履约主流程** |
| after_sale_status | ENUM('NONE','APPLIED','PROCESSING','APPROVED','REJECTED','REFUNDING','REFUNDED','CLOSED') | 非空，默认 NONE | **售后状态：退款/退货流程，与订单状态独立** |
| receiver_name / receiver_phone / receiver_address | VARCHAR | 非空 | 收货信息 |
| paid_at / shipped_at / completed_at | DATETIME | 可空 | 关键时间点 |
| created_at / updated_at | DATETIME | 非空 | 时间戳 |

> **核心业务规则（对齐 A 任务）**：`order_status` 与 `after_sale_status` 是两个独立字段，业务上互不覆盖。平台强制退款只改 `after_sale_status`（→ REFUNDED）与支付流水，**不覆盖履约状态**。

### 3.3 after_sale_tickets - 售后工单表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | BIGINT UNSIGNED | 主键，自增 | 工单ID |
| ticket_no | VARCHAR(40) | 非空，唯一 | 工单号 |
| order_id | BIGINT UNSIGNED | 非空，外键 → orders.id | 订单ID |
| order_item_id | BIGINT UNSIGNED | 可空，外键 → order_items.id | 订单明细ID |
| buyer_id / merchant_id | BIGINT UNSIGNED | 非空，外键 → users.id | 买家/商家ID |
| ticket_type | ENUM('REFUND_ONLY','RETURN_REFUND','EXCHANGE') | 非空 | 工单类型 |
| status | ENUM('APPLIED','PROCESSING','APPROVED','REJECTED','BUYER_SHIPPED','REFUNDING','COMPLETED','CLOSED') | 非空，默认 APPLIED | 工单状态 |
| reason | VARCHAR(200) | 非空 | 申请原因 |
| description | TEXT | 可空 | 问题描述 |
| evidence_urls | JSON | 可空 | 凭证图片URL列表 |
| requested_amount | DECIMAL(12,2) | 可空 | 申请退款金额 |
| merchant_reply | VARCHAR(500) | 可空 | 商家回复 |
| deadline | DATETIME | 可空 | 处理截止时间，超过自动介入（**E扩展**） |
| is_platform_intervened | TINYINT(1) | 非空，默认 0 | 平台是否已介入（**E扩展**） |
| platform_intervention | JSON | 可空 | 平台处理记录（**E扩展**） |
| completed_at | DATETIME | 可空 | 完成时间 |
| created_at / updated_at | DATETIME | 非空 | 时间戳 |

`platform_intervention` JSON 结构：`{"decision": "FORCE_REFUND"|"REJECT", "reason": "...", "operator_id": 1, "operator_name": "admin", "created_at": "..."}`

**状态流转图（平台视角）：**

```
APPLIED 待审核 ──(手动介入/超时自动介入)──> PROCESSING 处理中 ──(强制退款)──> COMPLETED 已退款
    │                                          │
    └──────────(驳回，原因必填)────────────────┴─────────────────────────> REJECTED 已驳回
```

### 3.4 payment_records - 支付流水表

| 字段 | 类型 | 说明 |
|---|---|---|
| payment_no | VARCHAR(40) 唯一 | 支付流水号 |
| order_id / buyer_id | BIGINT 外键 | 订单/买家 |
| amount | DECIMAL(12,2) | 支付金额 |
| payment_method | ENUM('ALIPAY','WECHAT','BANK_CARD','MOCK') | 支付方式（MOCK=模拟支付） |
| payment_status | ENUM('PENDING','SUCCESS','FAILED','REFUNDED') | 流水状态 |

> 平台强制退款时：全额退款将订单下 `SUCCESS` 流水同步为 `REFUNDED`。

### 3.5 order_status_logs - 订单及售后状态变更日志

| 字段 | 类型 | 说明 |
|---|---|---|
| order_id | BIGINT 外键 | 订单ID |
| operator_id | BIGINT 可空 | 操作人ID（系统操作为NULL） |
| status_type | ENUM('ORDER','AFTER_SALE') | 状态类型 |
| from_status / to_status | VARCHAR(30) | 变更前/后状态 |
| remark | VARCHAR(300) | 备注 |

### 3.6 E 自有表

**category - 平台类目表**：parent_id（0=顶级）、name、level（1-3）、sort、status（1启用/0禁用）。

**brand - 品牌表**：name（唯一）、logo、description、status。

**operation_log - 系统操作日志表**：admin_id（0=系统）、admin_name、action、target_type、target_id、detail、ip、created_at。

---

## 四、完整建表 SQL 脚本

完整脚本（含演示数据）见 `E/backend/sql/init.sql`，以下为 DDL 核心部分：

```sql
CREATE DATABASE IF NOT EXISTS `ecommerce` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `ecommerce`;

CREATE TABLE IF NOT EXISTS `users` (
  `id`                   BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `username`             VARCHAR(50)  NOT NULL COMMENT '用户名',
  `email`                VARCHAR(120) NOT NULL COMMENT '邮箱（登录账号）',
  `password_hash`        VARCHAR(255) NOT NULL COMMENT '密码哈希（PBKDF2，禁止明文）',
  `role`                 ENUM('BUYER','MERCHANT','ADMIN') NOT NULL DEFAULT 'BUYER' COMMENT '身份',
  `phone`                VARCHAR(20)  NULL COMMENT '手机号',
  `avatar_url`           VARCHAR(500) NULL COMMENT '头像URL',
  `account_status`       ENUM('ACTIVE','DISABLED','PENDING') NOT NULL DEFAULT 'ACTIVE' COMMENT '账号状态',
  `ban_reason`           VARCHAR(255) NULL COMMENT '封禁原因（E扩展）',
  `ban_until`            DATETIME     NULL COMMENT '封禁截止时间，NULL表示永久封禁（E扩展）',
  `merchant_application` JSON         NULL COMMENT '商家入驻申请与审核记录（E扩展）',
  `created_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role_status` (`role`, `account_status`)
) ENGINE=InnoDB COMMENT='用户表';

CREATE TABLE IF NOT EXISTS `products` (
  `id`             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '商品ID',
  `merchant_id`    BIGINT UNSIGNED NOT NULL COMMENT '所属商家',
  `name`           VARCHAR(160) NOT NULL COMMENT '商品名称',
  `sku`            VARCHAR(64)  NOT NULL COMMENT 'SKU',
  `description`    TEXT NULL COMMENT '商品描述',
  `price`          DECIMAL(12,2) UNSIGNED NOT NULL COMMENT '售价',
  `stock`          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '库存',
  `cover_url`      VARCHAR(500) NULL COMMENT '封面图URL',
  `product_status` ENUM('DRAFT','ON_SALE','OFF_SALE') NOT NULL DEFAULT 'DRAFT' COMMENT '商品状态',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `users`(`id`),
  UNIQUE KEY `uk_products_sku` (`sku`),
  KEY `idx_products_merchant_status` (`merchant_id`, `product_status`)
) ENGINE=InnoDB COMMENT='商品表';

CREATE TABLE IF NOT EXISTS `orders` (
  `id`                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '订单ID',
  `order_no`          VARCHAR(40) NOT NULL COMMENT '对外订单号',
  `buyer_id`          BIGINT UNSIGNED NOT NULL COMMENT '买家ID',
  `merchant_id`       BIGINT UNSIGNED NOT NULL COMMENT '商家ID（单商家订单）',
  `total_amount`      DECIMAL(12,2) UNSIGNED NOT NULL COMMENT '订单金额',
  `order_status`      ENUM('PENDING_PAYMENT','PAID','SHIPPED','COMPLETED','CANCELLED','CLOSED')
                      NOT NULL DEFAULT 'PENDING_PAYMENT' COMMENT '订单状态：支付及履约主流程',
  `after_sale_status` ENUM('NONE','APPLIED','PROCESSING','APPROVED','REJECTED','REFUNDING','REFUNDED','CLOSED')
                      NOT NULL DEFAULT 'NONE' COMMENT '售后状态：退款/退货流程，与订单状态独立',
  `receiver_name`     VARCHAR(50) NOT NULL DEFAULT '' COMMENT '收货人姓名',
  `receiver_phone`    VARCHAR(20) NOT NULL DEFAULT '' COMMENT '收货人电话',
  `receiver_address`  VARCHAR(500) NOT NULL DEFAULT '' COMMENT '收货地址',
  `paid_at`           DATETIME NULL COMMENT '支付时间',
  `shipped_at`        DATETIME NULL COMMENT '发货时间',
  `completed_at`      DATETIME NULL COMMENT '完成时间',
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`),
  CONSTRAINT `fk_orders_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `users`(`id`),
  UNIQUE KEY `uk_orders_order_no` (`order_no`),
  KEY `idx_orders_buyer_created` (`buyer_id`, `created_at`),
  KEY `idx_orders_merchant_status` (`merchant_id`, `order_status`),
  KEY `idx_orders_after_sale` (`after_sale_status`)
) ENGINE=InnoDB COMMENT='订单表';

CREATE TABLE IF NOT EXISTS `order_items` (
  `id`           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
  `order_id`     BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `product_id`   BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `product_name` VARCHAR(160) NOT NULL COMMENT '下单时商品名称快照',
  `sku`          VARCHAR(64)  NOT NULL COMMENT '下单时 SKU 快照',
  `unit_price`   DECIMAL(12,2) UNSIGNED NOT NULL COMMENT '下单时单价快照',
  `quantity`     INT UNSIGNED NOT NULL COMMENT '数量',
  `subtotal`     DECIMAL(12,2) UNSIGNED NOT NULL COMMENT '小计',
  CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  CONSTRAINT `fk_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  KEY `idx_items_order` (`order_id`)
) ENGINE=InnoDB COMMENT='订单明细表';

CREATE TABLE IF NOT EXISTS `after_sale_tickets` (
  `id`                     BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '工单ID',
  `ticket_no`              VARCHAR(40) NOT NULL COMMENT '工单号',
  `order_id`               BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_item_id`          BIGINT UNSIGNED NULL COMMENT '订单明细ID（整单售后可为空）',
  `buyer_id`               BIGINT UNSIGNED NOT NULL COMMENT '买家ID',
  `merchant_id`            BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  `ticket_type`            ENUM('REFUND_ONLY','RETURN_REFUND','EXCHANGE') NOT NULL COMMENT '工单类型',
  `status`                 ENUM('APPLIED','PROCESSING','APPROVED','REJECTED','BUYER_SHIPPED','REFUNDING','COMPLETED','CLOSED')
                           NOT NULL DEFAULT 'APPLIED' COMMENT '工单状态',
  `reason`                 VARCHAR(200) NOT NULL COMMENT '申请原因',
  `description`            TEXT NULL COMMENT '问题描述',
  `evidence_urls`          JSON NULL COMMENT '凭证图片URL列表',
  `requested_amount`       DECIMAL(12,2) UNSIGNED NULL COMMENT '申请退款金额',
  `merchant_reply`         VARCHAR(500) NULL COMMENT '商家回复',
  `deadline`               DATETIME NULL COMMENT '处理截止时间，超过则自动触发平台介入（E扩展）',
  `is_platform_intervened` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '平台是否已介入（E扩展）',
  `platform_intervention`  JSON NULL COMMENT '平台处理记录（E扩展）',
  `completed_at`           DATETIME NULL COMMENT '完成时间',
  `created_at`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `updated_at`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tickets_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  CONSTRAINT `fk_tickets_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`),
  CONSTRAINT `fk_tickets_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`),
  CONSTRAINT `fk_tickets_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `users`(`id`),
  UNIQUE KEY `uk_tickets_ticket_no` (`ticket_no`),
  KEY `idx_tickets_buyer_status` (`buyer_id`, `status`),
  KEY `idx_tickets_merchant_status` (`merchant_id`, `status`)
) ENGINE=InnoDB COMMENT='售后工单表';

CREATE TABLE IF NOT EXISTS `payment_records` (
  `id`                   BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '流水ID',
  `payment_no`           VARCHAR(40) NOT NULL COMMENT '支付流水号',
  `order_id`             BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `buyer_id`             BIGINT UNSIGNED NOT NULL COMMENT '买家ID',
  `amount`               DECIMAL(12,2) UNSIGNED NOT NULL COMMENT '支付金额',
  `payment_method`       ENUM('ALIPAY','WECHAT','BANK_CARD','MOCK') NOT NULL COMMENT '支付方式',
  `payment_status`       ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING' COMMENT '流水状态',
  `third_party_trade_no` VARCHAR(100) NULL COMMENT '第三方交易号',
  `paid_at`              DATETIME NULL COMMENT '支付时间',
  `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  CONSTRAINT `fk_payments_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`),
  UNIQUE KEY `uk_payments_payment_no` (`payment_no`),
  KEY `idx_payments_order` (`order_id`)
) ENGINE=InnoDB COMMENT='支付流水表';

CREATE TABLE IF NOT EXISTS `order_status_logs` (
  `id`          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  `order_id`    BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID（系统操作为NULL）',
  `status_type` ENUM('ORDER','AFTER_SALE') NOT NULL COMMENT '状态类型',
  `from_status` VARCHAR(30) NULL COMMENT '变更前状态',
  `to_status`   VARCHAR(30) NOT NULL COMMENT '变更后状态',
  `remark`      VARCHAR(300) NULL COMMENT '备注',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
  CONSTRAINT `fk_logs_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  CONSTRAINT `fk_logs_operator` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`),
  KEY `idx_logs_order_created` (`order_id`, `created_at`)
) ENGINE=InnoDB COMMENT='订单及售后状态变更日志';

-- category / brand / operation_log（E 自有表）见 init.sql
```

---

## 五、演示数据说明

脚本末尾使用 `INSERT IGNORE` 写入演示数据（重复执行不会重复插入）：

| 数据 | 说明 |
|---|---|
| 账号 | admin（ADMIN）、merchant@demo.com（MERCHANT）、buyer@demo.com（BUYER）、5 个普通买家（wangwu 已被永久封禁）、apply1/apply2 两条待审核商家申请 |
| 商品/订单/明细 | 6 个在售商品 + 6 个订单（状态覆盖 PAID/SHIPPED/COMPLETED，售后状态覆盖 APPLIED/PROCESSING/REFUNDED/REJECTED） |
| 售后工单 | 5 个工单覆盖 4 种状态；**AS20260825001 已超时，启动后端 30 秒内会被定时任务自动介入** |
| 支付流水 | 6 条（订单 4 已全额退款 → REFUNDED） |
| 状态日志 | 5 条演示记录 |
| E 自有表 | 类目 7 条、品牌 5 条、操作日志 3 条 |

**默认账号：**

| 角色 | 登录名 | 密码 |
|---|---|---|
| 管理员 | admin 或 admin@demo.com | 123456 |
| 商家 | merchant@demo.com | 123456 |
| 买家 | buyer@demo.com | 123456 |
| 待审核商家 | apply1@demo.com / apply2@demo.com | 123456 |

---

## 六、合并注意事项（与团队其他成员同步时）

1. **本库与 A 任务 schema.sql 同库同表**：A 成员先执行 `database/schema.sql`、E 成员后执行 `backend/sql/init.sql`（或反之）均不冲突（全部 CREATE IF NOT EXISTS + INSERT IGNORE）。
2. **E 扩展字段已注释标注**（users.ban_reason/ban_until/merchant_application、after_sale_tickets.deadline/is_platform_intervened/platform_intervention、E 自有表 category/brand/operation_log），组长汇总时如需统一命名可全局替换。
3. **products 表暂未关联类目/品牌**：E 的类目/品牌管理为独立模块；若后续商品端需要，建议在 products 表增加 `category_id`、`brand_id` 可空外键（该变更需由组长协调后统一执行）。
4. **密码哈希**：E 使用 PBKDF2-SHA256（`utils/security.py`）；A 任务 schema 注释建议 Argon2/bcrypt，合并时如需统一需组长决策并做密码迁移。
5. 旧库 `e_shop_admin` 已废弃（对齐前 E 的独立库），保留未删除；正式合并后可清理。
