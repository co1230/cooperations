-- =====================================================================
-- 电商平台 - 管理员后台系统（E）数据库初始化脚本
-- 数据库：ecommerce（与团队 A 任务 database/schema.sql 共用同一库）
-- 说明：
--   1. 本脚本可重复执行（CREATE IF NOT EXISTS + INSERT IGNORE，不破坏已有数据）
--   2. users/orders/order_items/products/after_sale_tickets/payment_records/order_status_logs
--      表结构对齐 A 任务 schema.sql；带注释的列（E扩展）为管理员后台新增字段
--   3. category/brand/operation_log 为 E 自有表（平台类目/品牌/操作日志）
--   4. 默认管理员：admin 或 admin@demo.com / 123456
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `ecommerce` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `ecommerce`;

-- ---------------------------------------------------------------------
-- 1. 用户表（对齐 A 任务 users 表：BUYER/MERCHANT/ADMIN 三种身份）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`                   BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `username`             VARCHAR(50)  NOT NULL COMMENT '用户名',
  `email`                VARCHAR(120) NOT NULL COMMENT '邮箱（登录账号）',
  `password_hash`        VARCHAR(255) NOT NULL COMMENT '密码哈希（PBKDF2，禁止明文）',
  `role`                 ENUM('BUYER','MERCHANT','ADMIN') NOT NULL DEFAULT 'BUYER' COMMENT '身份：BUYER买家 MERCHANT商家 ADMIN管理员',
  `phone`                VARCHAR(20)  NULL COMMENT '手机号',
  `avatar_url`           VARCHAR(500) NULL COMMENT '头像URL',
  `account_status`       ENUM('ACTIVE','DISABLED','PENDING') NOT NULL DEFAULT 'ACTIVE' COMMENT '账号状态：ACTIVE正常 DISABLED封禁 PENDING待审核',
  `ban_reason`           VARCHAR(255) NULL COMMENT '封禁原因（E扩展）',
  `ban_until`            DATETIME     NULL COMMENT '封禁截止时间，NULL表示永久封禁（E扩展）',
  `merchant_application` JSON         NULL COMMENT '商家入驻申请与审核记录（E扩展）：{shop_name,contact,description,applied_at,review}',
  `created_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role_status` (`role`, `account_status`)
) ENGINE=InnoDB COMMENT='用户表';

-- ---------------------------------------------------------------------
-- 2. 商品表（对齐 A 任务 products 表；商品数据由商家端维护，E 仅为外键完整性建表）
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 3. 订单表（对齐 A 任务 orders 表：订单状态与售后状态独立建模，互不覆盖）
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 4. 订单明细表（对齐 A 任务 order_items 表）
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 5. 售后工单表（对齐 A 任务 after_sale_tickets 表）
--    E扩展列：deadline（超时自动介入）、is_platform_intervened、platform_intervention（平台处理记录）
-- ---------------------------------------------------------------------
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
  `is_platform_intervened` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '平台是否已介入（E扩展，含超时自动介入）',
  `platform_intervention`  JSON NULL COMMENT '平台处理记录（E扩展）：{decision,reason,operator_id,operator_name,created_at}',
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

-- ---------------------------------------------------------------------
-- 6. 支付流水表（对齐 A 任务 payment_records 表；平台强制退款时同步流水状态）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_records` (
  `id`                   BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '流水ID',
  `payment_no`           VARCHAR(40) NOT NULL COMMENT '支付流水号',
  `order_id`             BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `buyer_id`             BIGINT UNSIGNED NOT NULL COMMENT '买家ID',
  `amount`               DECIMAL(12,2) UNSIGNED NOT NULL COMMENT '支付金额',
  `payment_method`       ENUM('ALIPAY','WECHAT','BANK_CARD','MOCK') NOT NULL COMMENT '支付方式：MOCK为模拟支付',
  `payment_status`       ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING' COMMENT '流水状态',
  `third_party_trade_no` VARCHAR(100) NULL COMMENT '第三方交易号',
  `paid_at`              DATETIME NULL COMMENT '支付时间',
  `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  CONSTRAINT `fk_payments_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`),
  UNIQUE KEY `uk_payments_payment_no` (`payment_no`),
  KEY `idx_payments_order` (`order_id`)
) ENGINE=InnoDB COMMENT='支付流水表';

-- ---------------------------------------------------------------------
-- 7. 订单及售后状态变更日志（对齐 A 任务 order_status_logs 表）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_status_logs` (
  `id`          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  `order_id`    BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID（系统操作为NULL）',
  `status_type` ENUM('ORDER','AFTER_SALE') NOT NULL COMMENT '状态类型：ORDER订单状态 AFTER_SALE售后状态',
  `from_status` VARCHAR(30) NULL COMMENT '变更前状态',
  `to_status`   VARCHAR(30) NOT NULL COMMENT '变更后状态',
  `remark`      VARCHAR(300) NULL COMMENT '备注',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
  CONSTRAINT `fk_logs_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  CONSTRAINT `fk_logs_operator` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`),
  KEY `idx_logs_order_created` (`order_id`, `created_at`)
) ENGINE=InnoDB COMMENT='订单及售后状态变更日志';

-- ---------------------------------------------------------------------
-- 8-10. E 自有表：平台类目、品牌、操作日志
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `category` (
  `id`         INT          NOT NULL AUTO_INCREMENT COMMENT '类目ID',
  `parent_id`  INT          NOT NULL DEFAULT 0 COMMENT '父级类目ID，0表示顶级类目',
  `name`       VARCHAR(50)  NOT NULL COMMENT '类目名称',
  `level`      INT          NOT NULL DEFAULT 1 COMMENT '层级：1一级 2二级 3三级',
  `sort`       INT          NOT NULL DEFAULT 0 COMMENT '排序值，越小越靠前',
  `status`     INT          NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台类目表（E自有）';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='品牌表（E自有）';

CREATE TABLE IF NOT EXISTS `operation_log` (
  `id`          INT          NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `admin_id`    BIGINT       NOT NULL DEFAULT 0 COMMENT '操作管理员ID，0表示系统自动操作',
  `admin_name`  VARCHAR(50)  NOT NULL COMMENT '操作人名称',
  `action`      VARCHAR(100) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50)  DEFAULT NULL COMMENT '操作对象类型',
  `target_id`   BIGINT       DEFAULT NULL COMMENT '操作对象ID',
  `detail`      VARCHAR(500) DEFAULT NULL COMMENT '操作详情',
  `ip`          VARCHAR(50)  DEFAULT NULL COMMENT '操作IP地址',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_log_admin_name` (`admin_name`),
  KEY `idx_log_action` (`action`),
  KEY `idx_log_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统操作日志表（E自有）';

-- =====================================================================
-- 以下为演示数据（INSERT IGNORE：重复执行不会重复插入）
-- 所有演示账号密码均为 123456（PBKDF2 加密结果相同）
-- =====================================================================

-- 用户：admin/商家/买家演示账号 + 普通买家 + 待审核商家（对齐 A 任务演示账号）
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `phone`, `account_status`, `ban_reason`, `ban_until`, `merchant_application`) VALUES
(1,  'admin',    'admin@demo.com',    'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'ADMIN',    NULL,           'ACTIVE',   NULL, NULL, NULL),
(2,  'merchant', 'merchant@demo.com', 'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'MERCHANT', NULL,           'ACTIVE',   NULL, NULL, NULL),
(3,  'buyer',    'buyer@demo.com',    'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'BUYER',    NULL,           'ACTIVE',   NULL, NULL, NULL),
(4,  'zhangsan', 'zhangsan@demo.com', 'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'BUYER',    '13800000001',  'ACTIVE',   NULL, NULL, NULL),
(5,  'lisi',     'lisi@demo.com',     'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'BUYER',    '13800000002',  'ACTIVE',   NULL, NULL, NULL),
(6,  'wangwu',   'wangwu@demo.com',   'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'BUYER',    '13800000003',  'DISABLED', '恶意刷单', NULL, NULL),
(7,  'zhaoliu',  'zhaoliu@demo.com',  'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'BUYER',    '13800000004',  'ACTIVE',   NULL, NULL, NULL),
(8,  'sunqi',    'sunqi@demo.com',    'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'BUYER',    '13800000005',  'ACTIVE',   NULL, NULL, NULL),
(9,  'apply1',   'apply1@demo.com',   'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'MERCHANT', NULL,           'PENDING',  NULL, NULL, '{"shop_name":"山茶手作","contact":"李雷","description":"主营手作陶瓷与茶具","applied_at":"2026-08-20T10:00:00","review":null}'),
(10, 'apply2',   'apply2@demo.com',   'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'MERCHANT', NULL,           'PENDING',  NULL, NULL, '{"shop_name":"云边杂货铺","contact":"韩梅梅","description":"主营家居杂货与文创","applied_at":"2026-08-21T15:30:00","review":null}');

-- 商品（商家 2 在售，对齐 A 任务模拟目录）
INSERT IGNORE INTO `products` (`id`, `merchant_id`, `name`, `sku`, `description`, `price`, `stock`, `product_status`) VALUES
(101, 2, '手冲咖啡分享壶',   'PRODUCT-101', '耐热玻璃 · 600ml',          128.00, 80,  'ON_SALE'),
(102, 2, '月影氛围台灯',     'PRODUCT-102', '三档暖光 · 无级调节',       219.00, 35,  'ON_SALE'),
(103, 2, '云感香薰加湿器',   'PRODUCT-103', '静音运行 · 细腻雾化',       169.00, 60,  'ON_SALE'),
(104, 2, '原木桌面收纳架',   'PRODUCT-104', '北美黑胡桃 · 手工打磨',     119.00, 45,  'ON_SALE'),
(105, 2, '轻氧保温杯',       'PRODUCT-105', '316不锈钢 · 450ml',         129.00, 120, 'ON_SALE'),
(106, 2, '亚麻午睡毯',       'PRODUCT-106', '亲肤透气 · 四季可用',       169.00, 70,  'ON_SALE');

-- 订单（订单状态与售后状态独立；6 号订单售后状态为 REJECTED 演示平台驳回）
INSERT IGNORE INTO `orders` (`id`, `order_no`, `buyer_id`, `merchant_id`, `total_amount`, `order_status`, `after_sale_status`, `receiver_name`, `receiver_phone`, `receiver_address`, `paid_at`, `shipped_at`, `completed_at`) VALUES
(1, 'E20260826001', 4, 2, 128.00, 'PAID',      'APPLIED',    '张三', '13800000001', '北京市海淀区中关村大街 1 号', DATE_SUB(NOW(), INTERVAL 1 DAY),  NULL, NULL),
(2, 'E20260825001', 5, 2, 219.00, 'SHIPPED',   'PROCESSING', '李四', '13800000002', '上海市浦东新区世纪大道 100 号', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
(3, 'E20260824001', 7, 2, 169.00, 'PAID',      'APPLIED',    '赵六', '13800000004', '广州市天河区体育西路 50 号', DATE_SUB(NOW(), INTERVAL 1 DAY),  NULL, NULL),
(4, 'E20260823001', 4, 2, 119.00, 'COMPLETED', 'REFUNDED',   '张三', '13800000001', '北京市海淀区中关村大街 1 号', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 'E20260822001', 8, 2, 129.00, 'COMPLETED', 'NONE',       '孙七', '13800000005', '深圳市南山区科技园 8 号', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 'E20260821001', 5, 2, 169.00, 'PAID',      'REJECTED',   '李四', '13800000002', '上海市浦东新区世纪大道 100 号', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL);

-- 订单明细（每个订单一条）
INSERT IGNORE INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `sku`, `unit_price`, `quantity`, `subtotal`) VALUES
(1, 1, 101, '手冲咖啡分享壶', 'PRODUCT-101', 128.00, 1, 128.00),
(2, 2, 102, '月影氛围台灯',   'PRODUCT-102', 219.00, 1, 219.00),
(3, 3, 103, '云感香薰加湿器', 'PRODUCT-103', 169.00, 1, 169.00),
(4, 4, 104, '原木桌面收纳架', 'PRODUCT-104', 119.00, 1, 119.00),
(5, 5, 105, '轻氧保温杯',     'PRODUCT-105', 129.00, 1, 129.00),
(6, 6, 106, '亚麻午睡毯',     'PRODUCT-106', 169.00, 1, 169.00);

-- 售后工单（覆盖四种状态；工单2 deadline 已过期 → 启动后端 30 秒内自动介入）
INSERT IGNORE INTO `after_sale_tickets` (`id`, `ticket_no`, `order_id`, `order_item_id`, `buyer_id`, `merchant_id`, `ticket_type`, `status`, `reason`, `description`, `requested_amount`, `merchant_reply`, `deadline`, `is_platform_intervened`, `platform_intervention`, `completed_at`) VALUES
(1, 'AS20260826001', 1, 1, 4, 2, 'REFUND_ONLY',   'APPLIED',    '质量问题',       '收到后壶身有裂纹',         128.00, NULL,                    DATE_ADD(NOW(), INTERVAL 24 HOUR), 0, NULL, NULL),
(2, 'AS20260825001', 3, 3, 7, 2, 'RETURN_REFUND', 'APPLIED',    '七天无理由退货', '商品与预期不符，申请退货', 169.00, NULL,                    DATE_SUB(NOW(), INTERVAL 2 HOUR),  0, NULL, NULL),
(3, 'AS20260824001', 2, 2, 5, 2, 'REFUND_ONLY',   'PROCESSING', '商品与描述不符', '灯光色温与描述不符',       219.00, '商家已同意退款（演示）',    DATE_ADD(NOW(), INTERVAL 10 HOUR), 1, NULL, NULL),
(4, 'AS20260823001', 4, 4, 4, 2, 'REFUND_ONLY',   'COMPLETED',  '物流破损',       '收到商品时包装已损坏',     119.00, NULL,                    DATE_SUB(NOW(), INTERVAL 2 DAY),   1, '{"decision":"FORCE_REFUND","reason":"平台强制退款","operator_id":1,"operator_name":"admin","created_at":"2026-08-27T10:00:00"}', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 'AS20260822001', 6, 6, 5, 2, 'RETURN_REFUND', 'REJECTED',   '不喜欢',         '颜色与图片不符',           169.00, NULL,                    DATE_SUB(NOW(), INTERVAL 1 DAY),   1, '{"decision":"REJECT","reason":"证据不足，驳回申请","operator_id":1,"operator_name":"admin","created_at":"2026-08-27T09:00:00"}', NULL);

-- 支付流水（订单4 已全额退款 → REFUNDED）
INSERT IGNORE INTO `payment_records` (`id`, `payment_no`, `order_id`, `buyer_id`, `amount`, `payment_method`, `payment_status`, `paid_at`) VALUES
(1, 'MOCK-E20260826001', 1, 4, 128.00, 'MOCK', 'SUCCESS', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 'MOCK-E20260825001', 2, 5, 219.00, 'MOCK', 'SUCCESS', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'MOCK-E20260824001', 3, 7, 169.00, 'MOCK', 'SUCCESS', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 'MOCK-E20260823001', 4, 4, 119.00, 'MOCK', 'REFUNDED', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 'MOCK-E20260822001', 5, 8, 129.00, 'MOCK', 'SUCCESS', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(6, 'MOCK-E20260821001', 6, 5, 169.00, 'MOCK', 'SUCCESS', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- 订单售后状态变更日志（演示）
INSERT IGNORE INTO `order_status_logs` (`id`, `order_id`, `operator_id`, `status_type`, `from_status`, `to_status`, `remark`) VALUES
(1, 1, 4, 'AFTER_SALE', 'NONE',   'APPLIED',    '买家申请仅退款'),
(2, 2, 5, 'AFTER_SALE', 'NONE',   'PROCESSING', '买家申请退款，平台介入处理'),
(3, 4, 1, 'AFTER_SALE', 'APPLIED', 'REFUNDED',  '平台强制退款：平台强制退款'),
(4, 6, 1, 'AFTER_SALE', 'APPLIED', 'REJECTED',  '平台驳回：证据不足，驳回申请');

-- E 自有表演示数据：类目 / 品牌 / 操作日志
INSERT IGNORE INTO `category` (`id`, `parent_id`, `name`, `level`, `sort`, `status`) VALUES
(1, 0, '手机数码', 1, 1, 1),
(2, 0, '服饰鞋包', 1, 2, 1),
(3, 1, '手机',     2, 1, 1),
(4, 1, '电脑办公', 2, 2, 1),
(5, 2, '男装',     2, 1, 1),
(6, 2, '女装',     2, 2, 1),
(7, 3, '智能手机', 3, 1, 1);

INSERT IGNORE INTO `brand` (`id`, `name`, `logo`, `description`, `status`) VALUES
(1, '华为',     'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', '华为技术有限公司，全球领先的ICT基础设施和智能终端提供商', 1),
(2, '小米',     'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', '小米科技，专注于智能硬件和电子产品研发', 1),
(3, '苹果',     'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 'Apple Inc.，全球知名科技公司', 1),
(4, '耐克',     'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 'NIKE，全球著名体育运动品牌', 1),
(5, '阿迪达斯', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 'adidas，全球著名体育运动品牌', 0);

INSERT IGNORE INTO `operation_log` (`id`, `admin_id`, `admin_name`, `action`, `target_type`, `target_id`, `detail`, `ip`) VALUES
(1, 1, 'admin', '管理员登录', 'admin', 1, '管理员登录系统', '127.0.0.1'),
(2, 1, 'admin', '新增类目',   'category', 3, '新增类目：手机', '127.0.0.1'),
(3, 1, 'admin', '强制退款',   'after_sale', 4, '对售后工单 AS20260823001 执行强制退款，金额 119.00', '127.0.0.1');
