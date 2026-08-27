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
  `id`           INT          NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no`     VARCHAR(50)  NOT NULL COMMENT '订单号',
  `user_id`      INT          NOT NULL COMMENT '下单用户ID',
  `product_name` VARCHAR(255) NOT NULL COMMENT '商品名称（简化）',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '订单金额',
  `status`       INT          NOT NULL DEFAULT 1 COMMENT '订单状态：0待付款 1已付款 2已发货 3已完成 4已退款 5已关闭',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
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

-- =====================================================================
-- 以下为演示数据（INSERT IGNORE：重复执行不会重复插入）
-- =====================================================================

-- 默认管理员：admin / 123456（密码为 PBKDF2 加密结果）
INSERT IGNORE INTO `admin` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', 'pbkdf2_sha256$100000$64bcabf7be9deaa6a86131d838f10bd0$8acb0fa5a20feda31f5a6c348b57a23136e16c234a20d1f2280767836e8fc18c', 'super');

-- 演示用户（密码均为 sha256("123456")，其中 wangwu 已被永久封禁）
INSERT IGNORE INTO `user` (`id`, `username`, `password`, `nickname`, `phone`, `status`, `ban_reason`, `ban_until`) VALUES
(1, 'zhangsan', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '张三', '13800000001', 0, NULL, NULL),
(2, 'lisi',     '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '李四', '13800000002', 0, NULL, NULL),
(3, 'wangwu',   '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '王五', '13800000003', 1, '恶意刷单', NULL),
(4, 'zhaoliu',  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '赵六', '13800000004', 0, NULL, NULL),
(5, 'sunqi',    '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '孙七', '13800000005', 0, NULL, NULL);

-- 演示类目（两级+一个三级）
INSERT IGNORE INTO `category` (`id`, `parent_id`, `name`, `level`, `sort`, `status`) VALUES
(1, 0, '手机数码', 1, 1, 1),
(2, 0, '服饰鞋包', 1, 2, 1),
(3, 1, '手机',     2, 1, 1),
(4, 1, '电脑办公', 2, 2, 1),
(5, 2, '男装',     2, 1, 1),
(6, 2, '女装',     2, 2, 1),
(7, 3, '智能手机', 3, 1, 1);

-- 演示品牌
INSERT IGNORE INTO `brand` (`id`, `name`, `logo`, `description`, `status`) VALUES
(1, '华为',     'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', '华为技术有限公司，全球领先的ICT基础设施和智能终端提供商', 1),
(2, '小米',     'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', '小米科技，专注于智能硬件和电子产品研发', 1),
(3, '苹果',     'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 'Apple Inc.，全球知名科技公司', 1),
(4, '耐克',     'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 'NIKE，全球著名体育运动品牌', 1),
(5, '阿迪达斯', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 'adidas，全球著名体育运动品牌', 0);

-- 演示订单
INSERT IGNORE INTO `order` (`id`, `order_no`, `user_id`, `product_name`, `total_amount`, `status`) VALUES
(1, 'E20260801001', 1, '华为Mate 70 Pro 手机',      6999.00, 1),
(2, 'E20260802001', 2, '小米15 Ultra 手机',         6499.00, 2),
(3, 'E20260803001', 4, '苹果 iPhone 16 Pro',        8999.00, 1),
(4, 'E20260804001', 1, '耐克 Air Max 运动鞋',        899.00, 1),
(5, 'E20260805001', 5, '阿迪达斯三叶草卫衣',         599.00, 3),
(6, 'E20260806001', 2, '联想拯救者笔记本电脑',       7999.00, 4);

-- 演示售后单
-- 状态说明：0待处理 1平台已介入 2已完成 3已关闭
-- 单号2：deadline 已过期且仍为待处理 → 启动后端后 30 秒内会被定时任务自动标记"平台已介入"
INSERT IGNORE INTO `after_sale` (`id`, `after_sale_no`, `order_id`, `user_id`, `type`, `reason`, `description`, `status`, `deadline`, `is_platform_intervened`, `result`) VALUES
(1, 'AS20260801001', 1, 1, 'refund', '质量问题',       '手机屏幕有坏点',             0, DATE_ADD(NOW(), INTERVAL 24 HOUR), 0, NULL),
(2, 'AS20260802001', 3, 4, 'return', '七天无理由退货', '商品与预期不符，申请退货',     0, DATE_SUB(NOW(), INTERVAL 2 HOUR),  0, NULL),
(3, 'AS20260803001', 4, 1, 'refund', '商品与描述不符', '鞋子尺码偏小，与描述不符',     1, DATE_ADD(NOW(), INTERVAL 10 HOUR), 1, NULL),
(4, 'AS20260804001', 2, 2, 'refund', '物流破损',       '收到商品时包装已损坏',         2, DATE_SUB(NOW(), INTERVAL 2 DAY),   1, '管理员强制退款'),
(5, 'AS20260805001', 6, 2, 'return', '不喜欢',         '颜色与图片不符',               3, DATE_SUB(NOW(), INTERVAL 1 DAY),   1, '证据不足，关闭争议');

-- 演示操作日志
INSERT IGNORE INTO `operation_log` (`id`, `admin_id`, `admin_name`, `action`, `target_type`, `target_id`, `detail`, `ip`) VALUES
(1, 1, 'admin', '管理员登录', 'admin',      1, '管理员登录系统', '127.0.0.1'),
(2, 1, 'admin', '新增类目',   'category',   3, '新增类目：手机', '127.0.0.1'),
(3, 0, '系统', '超时自动介入', 'after_sale', 2, '售后单 AS20260802001 超过处理时限未处理，系统自动标记平台介入', NULL);
