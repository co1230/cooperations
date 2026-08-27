# 数据库建表 SQL 文档

> 项目：`E`（电商平台 - 管理员后台系统）
> 数据库：MySQL 8.x，库名 `e_shop_admin`
> 完整脚本位置：`E/backend/sql/init.sql`（可直接在 MySQL 客户端执行，可重复执行不破坏数据）

---

## 一、数据库信息

| 项目 | 说明 |
|---|---|
| 库名 | `e_shop_admin` |
| 字符集 | utf8mb4（支持 emoji 等 4 字节字符） |
| 排序规则 | utf8mb4_unicode_ci |
| 存储引擎 | InnoDB |
| ORM 对应 | 后端 `backend/models/` 下的 SQLAlchemy 模型与下表一一对应 |

**两种建表方式（二选一即可，也可都执行）：**

1. **手动执行**：在 MySQL 客户端（Navicat / DataGrip / mysql 命令行）执行 `backend/sql/init.sql`
2. **自动建表**：直接启动后端，`main.py` 启动时会自动执行 `Base.metadata.create_all`（表不存在时创建），并自动创建默认管理员 `admin / 123456`

---

## 二、表设计说明（共 7 张表）

### 2.1 admin - 管理员表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT | 主键，自增 | 管理员ID |
| username | VARCHAR(50) | 非空，唯一 | 用户名 |
| password | VARCHAR(255) | 非空 | 密码（PBKDF2-SHA256 加密存储） |
| role | VARCHAR(20) | 非空，默认 'admin' | 角色：super 超级管理员 / admin 普通管理员 |
| created_at | DATETIME | 非空，默认当前时间 | 创建时间 |
| updated_at | DATETIME | 非空，自动更新 | 更新时间 |

### 2.2 user - 用户表（简化版）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT | 主键，自增 | 用户ID |
| username | VARCHAR(50) | 非空，唯一 | 用户名 |
| password | VARCHAR(255) | 非空 | 密码（加密存储） |
| nickname | VARCHAR(50) | 可空 | 昵称 |
| avatar | VARCHAR(255) | 可空 | 头像URL |
| phone | VARCHAR(20) | 可空 | 手机号 |
| status | INT | 非空，默认 0 | 账号状态：**0 正常 / 1 封禁** |
| ban_reason | VARCHAR(255) | 可空 | 封禁原因 |
| ban_until | DATETIME | 可空 | 封禁截止时间，**NULL 表示永久封禁** |
| created_at | DATETIME | 非空，默认当前时间 | 创建时间 |
| updated_at | DATETIME | 非空，自动更新 | 更新时间 |

### 2.3 category - 平台类目表（树形，最多三级）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT | 主键，自增 | 类目ID |
| parent_id | INT | 非空，默认 0 | 父级类目ID，**0 表示顶级类目** |
| name | VARCHAR(50) | 非空 | 类目名称 |
| level | INT | 非空，默认 1 | 层级：1 一级 / 2 二级 / 3 三级 |
| sort | INT | 非空，默认 0 | 排序值，越小越靠前 |
| status | INT | 非空，默认 1 | 状态：**1 启用 / 0 禁用** |
| created_at | DATETIME | 非空，默认当前时间 | 创建时间 |
| updated_at | DATETIME | 非空，自动更新 | 更新时间 |

### 2.4 brand - 品牌表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT | 主键，自增 | 品牌ID |
| name | VARCHAR(50) | 非空，唯一 | 品牌名称 |
| logo | VARCHAR(255) | 可空 | 品牌Logo图片URL |
| description | VARCHAR(500) | 可空 | 品牌描述 |
| status | INT | 非空，默认 1 | 状态：**1 启用 / 0 禁用** |
| created_at | DATETIME | 非空，默认当前时间 | 创建时间 |
| updated_at | DATETIME | 非空，自动更新 | 更新时间 |

### 2.5 order - 订单表（简化版，仅供售后模块使用）

> 注意：`order` 是 MySQL 保留字，SQL 中必须使用反引号 `` `order` ``。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT | 主键，自增 | 订单ID |
| order_no | VARCHAR(50) | 非空，唯一 | 订单号 |
| user_id | INT | 非空，外键 → user.id | 下单用户ID |
| product_name | VARCHAR(255) | 非空 | 商品名称（简化） |
| total_amount | DECIMAL(10,2) | 非空 | 订单金额 |
| status | INT | 非空，默认 1 | 订单状态：**0待付款 1已付款 2已发货 3已完成 4已退款 5已关闭** |
| created_at | DATETIME | 非空，默认当前时间 | 创建时间 |
| updated_at | DATETIME | 非空，自动更新 | 更新时间 |

### 2.6 after_sale - 售后单表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT | 主键，自增 | 售后单ID |
| after_sale_no | VARCHAR(50) | 非空，唯一 | 售后单号 |
| order_id | INT | 非空，外键 → order.id | 关联订单ID |
| user_id | INT | 非空，外键 → user.id | 申请用户ID |
| type | ENUM('return','refund') | 非空 | 售后类型：return 退货 / refund 退款 |
| reason | VARCHAR(255) | 非空 | 申请原因 |
| description | VARCHAR(500) | 可空 | 问题描述 |
| status | INT | 非空，默认 0 | 状态：**0待处理 1平台已介入 2已完成(已退款) 3已关闭(争议关闭)** |
| deadline | DATETIME | 非空 | 处理截止时间，**超过则自动触发平台介入** |
| is_platform_intervened | TINYINT(1) | 非空，默认 0 | 平台是否已介入：0 否 / 1 是 |
| result | VARCHAR(255) | 可空 | 处理结果说明 |
| created_at | DATETIME | 非空，默认当前时间 | 申请时间 |
| updated_at | DATETIME | 非空，自动更新 | 更新时间 |

**状态流转图：**

```
0 待处理 ──(超时自动介入 / 管理员手动介入)──> 1 平台已介入 ──(强制退款)──> 2 已完成
   │                                            │
   └────────────(关闭争议)──────────────────────┴───────────────────────> 3 已关闭
```

### 2.7 operation_log - 系统操作日志表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT | 主键，自增 | 日志ID |
| admin_id | INT | 非空，默认 0 | 操作管理员ID，**0 表示系统自动操作** |
| admin_name | VARCHAR(50) | 非空 | 操作人名称 |
| action | VARCHAR(100) | 非空 | 操作类型（见 API 文档附录 8.1） |
| target_type | VARCHAR(50) | 可空 | 操作对象类型（admin/category/brand/user/after_sale） |
| target_id | INT | 可空 | 操作对象ID |
| detail | VARCHAR(500) | 可空 | 操作详情 |
| ip | VARCHAR(50) | 可空 | 操作IP地址 |
| created_at | DATETIME | 非空，默认当前时间 | 操作时间 |

---

## 三、完整建表 SQL 脚本

以下脚本与 `E/backend/sql/init.sql` 完全一致，可直接复制执行：

```sql
-- =====================================================================
-- 电商平台 - 管理员后台系统 数据库初始化脚本
-- 数据库：e_shop_admin
-- 说明：
--   1. 本脚本可重复执行（CREATE IF NOT EXISTS + INSERT IGNORE，不破坏已有数据）
--   2. 建表结构与后端 ORM 模型（backend/models）保持一致
--   3. 默认管理员账号：admin / 123456
--   4. 也可以不执行本脚本：直接启动后端，ORM 会自动建表并创建默认管理员
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `e_shop_admin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `e_shop_admin`;

-- ---------------------------------------------------------------------
-- 1. 管理员表
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin` (
  `id`         INT          NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username`   VARCHAR(50)  NOT NULL COMMENT '用户名',
  `password`   VARCHAR(255) NOT NULL COMMENT '密码（PBKDF2加密存储）',
  `role`       VARCHAR(20)  NOT NULL DEFAULT 'admin' COMMENT '角色：super 超级管理员 / admin 普通管理员',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ---------------------------------------------------------------------
-- 2. 用户表（简化版）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id`         INT          NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`   VARCHAR(50)  NOT NULL COMMENT '用户名',
  `password`   VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
  `nickname`   VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
  `avatar`     VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `phone`      VARCHAR(20)  DEFAULT NULL COMMENT '手机号',
  `status`     INT          NOT NULL DEFAULT 0 COMMENT '账号状态：0正常 1封禁',
  `ban_reason` VARCHAR(255) DEFAULT NULL COMMENT '封禁原因',
  `ban_until`  DATETIME     DEFAULT NULL COMMENT '封禁截止时间，NULL表示永久封禁',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ---------------------------------------------------------------------
-- 3. 平台类目表（树形结构，最多三级）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `category` (
  `id`         INT         NOT NULL AUTO_INCREMENT COMMENT '类目ID',
  `parent_id`  INT         NOT NULL DEFAULT 0 COMMENT '父级类目ID，0表示顶级类目',
  `name`       VARCHAR(50) NOT NULL COMMENT '类目名称',
  `level`      INT         NOT NULL DEFAULT 1 COMMENT '层级：1一级 2二级 3三级',
  `sort`       INT         NOT NULL DEFAULT 0 COMMENT '排序值，越小越靠前',
  `status`     INT         NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台类目表';

-- ---------------------------------------------------------------------
-- 4. 品牌表
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `brand` (
  `id`          INT          NOT NULL AUTO_INCREMENT COMMENT '品牌ID',
  `name`        VARCHAR(50)  NOT NULL COMMENT '品牌名称',
  `logo`        VARCHAR(255) DEFAULT NULL COMMENT '品牌Logo图片URL',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '品牌描述',
  `status`      INT          NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_brand_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='品牌表';

-- ---------------------------------------------------------------------
-- 5. 订单表（简化版，仅售后模块所需字段）
--    注：order 为 MySQL 保留字，必须加反引号
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order` (
  `id`           INT           NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no`     VARCHAR(50)   NOT NULL COMMENT '订单号',
  `user_id`      INT           NOT NULL COMMENT '下单用户ID',
  `product_name` VARCHAR(255)  NOT NULL COMMENT '商品名称（简化）',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '订单金额',
  `status`       INT           NOT NULL DEFAULT 1 COMMENT '订单状态：0待付款 1已付款 2已发货 3已完成 4已退款 5已关闭',
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_order_user` (`user_id`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表（简化版）';

-- ---------------------------------------------------------------------
-- 6. 售后单表
--    状态流转：0待处理 →(超时自动介入/手动介入)→ 1平台已介入 →(强制退款)→ 2已完成
--              0/1 →(关闭争议)→ 3已关闭
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `after_sale` (
  `id`                     INT          NOT NULL AUTO_INCREMENT COMMENT '售后单ID',
  `after_sale_no`          VARCHAR(50)  NOT NULL COMMENT '售后单号',
  `order_id`               INT          NOT NULL COMMENT '关联订单ID',
  `user_id`                INT          NOT NULL COMMENT '申请用户ID',
  `type`                   ENUM('return','refund') NOT NULL COMMENT '售后类型：return退货 refund退款',
  `reason`                 VARCHAR(255) NOT NULL COMMENT '申请原因',
  `description`            VARCHAR(500) DEFAULT NULL COMMENT '问题描述',
  `status`                 INT          NOT NULL DEFAULT 0 COMMENT '状态：0待处理 1平台已介入 2已完成(已退款) 3已关闭(争议关闭)',
  `deadline`               DATETIME     NOT NULL COMMENT '处理截止时间，超过则自动触发平台介入',
  `is_platform_intervened` TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '平台是否已介入：0否 1是',
  `result`                 VARCHAR(255) DEFAULT NULL COMMENT '处理结果说明',
  `created_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  `updated_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_after_sale_no` (`after_sale_no`),
  KEY `idx_after_sale_order` (`order_id`),
  KEY `idx_after_sale_user` (`user_id`),
  KEY `idx_after_sale_status` (`status`),
  CONSTRAINT `fk_after_sale_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`),
  CONSTRAINT `fk_after_sale_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后单表';

-- ---------------------------------------------------------------------
-- 7. 系统操作日志表
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `operation_log` (
  `id`          INT          NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `admin_id`    INT          NOT NULL DEFAULT 0 COMMENT '操作管理员ID，0表示系统自动操作',
  `admin_name`  VARCHAR(50)  NOT NULL COMMENT '操作人名称',
  `action`      VARCHAR(100) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50)  DEFAULT NULL COMMENT '操作对象类型',
  `target_id`   INT          DEFAULT NULL COMMENT '操作对象ID',
  `detail`      VARCHAR(500) DEFAULT NULL COMMENT '操作详情',
  `ip`          VARCHAR(50)  DEFAULT NULL COMMENT '操作IP地址',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_log_admin_name` (`admin_name`),
  KEY `idx_log_action` (`action`),
  KEY `idx_log_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统操作日志表';
```

---

## 四、演示数据说明

脚本末尾使用 `INSERT IGNORE` 写入演示数据（重复执行不会重复插入）：

| 数据 | 说明 |
|---|---|
| 管理员 | `admin / 123456`（PBKDF2 加密存储，角色 super） |
| 用户 | 5 个演示用户，其中 `wangwu` 已被永久封禁（原因：恶意刷单） |
| 类目 | 2 个顶级类目 + 4 个二级 + 1 个三级 |
| 品牌 | 5 个品牌，其中「阿迪达斯」为禁用状态 |
| 订单 | 6 个演示订单 |
| 售后单 | 5 个演示售后单，覆盖 4 种状态；其中 **AS20260802001 已超时未处理**，启动后端 30 秒内会被定时任务自动标记「平台已介入」 |
| 日志 | 3 条演示日志 |

**默认账号：**

| 角色 | 用户名 | 密码 | 说明 |
|---|---|---|---|
| 超级管理员 | admin | 123456 | 若未执行 SQL，后端首次启动时也会自动创建 |
