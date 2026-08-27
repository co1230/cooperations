-- =====================================================================
-- 成员D：商家后台数据库初始化脚本
-- 数据库：e_shop_admin
--
-- 模块：
-- 1. 商品管理 product
-- 2. 商家订单管理 order
-- 3. 商家售后审核 after_sale
--
-- 依赖成员E：
-- category
-- brand
-- user
-- =====================================================================



-- =====================================================================
-- 数据库
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `e_shop_admin`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;


USE `e_shop_admin`;





-- =====================================================================
-- 一、商品表 product
-- =====================================================================


CREATE TABLE IF NOT EXISTS `product` (

    `id` INT NOT NULL AUTO_INCREMENT
        COMMENT '商品ID',


    `category_id` INT NOT NULL
        COMMENT '商品所属类目ID',


    `brand_id` INT NOT NULL
        COMMENT '商品所属品牌ID',


    `name` VARCHAR(100) NOT NULL
        COMMENT '商品名称',


    `description` VARCHAR(500) DEFAULT NULL
        COMMENT '商品描述',


    `price` DECIMAL(10,2) NOT NULL
        COMMENT '商品售价',


    `stock` INT NOT NULL DEFAULT 0
        COMMENT '商品库存数量',


    `image` VARCHAR(255) DEFAULT NULL
        COMMENT '商品图片URL',


    `status` INT NOT NULL DEFAULT 1
        COMMENT '商品状态：1上架 0下架',


    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT '创建时间',


    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
        COMMENT '更新时间',



    PRIMARY KEY (`id`),



    INDEX `idx_product_category`
    (`category_id`),



    INDEX `idx_product_brand`
    (`brand_id`),



    INDEX `idx_product_status`
    (`status`),



    CONSTRAINT `fk_product_category`

    FOREIGN KEY (`category_id`)

    REFERENCES `category`(`id`),



    CONSTRAINT `fk_product_brand`

    FOREIGN KEY (`brand_id`)

    REFERENCES `brand`(`id`)



)

ENGINE=InnoDB

DEFAULT CHARSET=utf8mb4

COMMENT='商品管理表';







-- =====================================================================
-- 商品测试数据
-- =====================================================================


INSERT IGNORE INTO `product`
(
    `id`,
    `category_id`,
    `brand_id`,
    `name`,
    `description`,
    `price`,
    `stock`,
    `image`,
    `status`
)

VALUES


(
    1,
    1,
    1,
    '苹果手机',
    '旗舰智能手机',
    7999.00,
    100,
    'https://example.com/apple.jpg',
    1
),


(
    2,
    1,
    2,
    '华为笔记本',
    '商务办公电脑',
    5999.00,
    50,
    'https://example.com/huawei.jpg',
    1
),


(
    3,
    2,
    3,
    '运动鞋',
    '男女运动鞋',
    399.00,
    200,
    'https://example.com/shoes.jpg',
    0
);
-- =====================================================================
-- 二、商家订单表 order
-- =====================================================================


CREATE TABLE IF NOT EXISTS `order`
(

    `id` INT NOT NULL AUTO_INCREMENT
        COMMENT '订单ID',


    `order_no` VARCHAR(50) NOT NULL UNIQUE
        COMMENT '订单编号',


    `user_id` INT NOT NULL
        COMMENT '购买用户ID',


    `product_id` INT NOT NULL
        COMMENT '商品ID',


    `product_name` VARCHAR(255) NOT NULL
        COMMENT '商品名称',


    `quantity` INT NOT NULL DEFAULT 1
        COMMENT '购买数量',


    `total_amount` DECIMAL(10,2) NOT NULL
        COMMENT '订单金额',



    -- =========================
    -- 订单状态
    --
    -- 0 待付款
    -- 1 待发货
    -- 2 已发货
    -- 3 已完成
    -- 4 已退款
    -- =========================

    `status` INT NOT NULL DEFAULT 1
        COMMENT '订单状态：0待付款 1待发货 2已发货 3已完成 4已退款',



    -- =========================
    -- 物流信息
    -- =========================

    `express_company` VARCHAR(100) DEFAULT NULL
        COMMENT '物流公司',


    `tracking_number` VARCHAR(100) DEFAULT NULL
        COMMENT '物流单号',


    `shipped_at` DATETIME DEFAULT NULL
        COMMENT '发货时间',



    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT '创建时间',


    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
        COMMENT '更新时间',




    PRIMARY KEY (`id`),



    INDEX `idx_order_status`
    (`status`),



    INDEX `idx_order_user`
    (`user_id`),



    INDEX `idx_order_product`
    (`product_id`),



    CONSTRAINT `fk_order_product`

    FOREIGN KEY (`product_id`)

    REFERENCES `product`(`id`)



)

ENGINE=InnoDB

DEFAULT CHARSET=utf8mb4

COMMENT='商家订单表';






-- =====================================================================
-- 订单测试数据
-- =====================================================================


INSERT IGNORE INTO `order`
(
    `id`,
    `order_no`,
    `user_id`,
    `product_id`,
    `product_name`,
    `quantity`,
    `total_amount`,
    `status`
)

VALUES



(
    1,
    'ORD20260001',
    1,
    1,
    '苹果手机',
    1,
    7999.00,
    1
),



(
    2,
    'ORD20260002',
    2,
    2,
    '华为笔记本',
    1,
    5999.00,
    2
),



(
    3,
    'ORD20260003',
    3,
    3,
    '运动鞋',
    2,
    798.00,
    3
);
-- =====================================================================
-- 三、商家售后审核表 after_sale
-- =====================================================================


CREATE TABLE IF NOT EXISTS `after_sale`
(

    `id` INT NOT NULL AUTO_INCREMENT
        COMMENT '售后ID',



    `order_id` INT NOT NULL
        COMMENT '关联订单ID',



    `user_id` INT NOT NULL
        COMMENT '申请用户ID',



    `type` VARCHAR(20) NOT NULL
        COMMENT '售后类型：refund退款 return退货',



    `reason` VARCHAR(255) NOT NULL
        COMMENT '申请原因',



    `description` VARCHAR(500) DEFAULT NULL
        COMMENT '问题描述',



    -- =========================
    -- 售后状态
    --
    -- 0 待审核
    -- 1 同意退款
    -- 2 拒绝退款
    -- 3 完成
    -- =========================

    `status` INT NOT NULL DEFAULT 0
        COMMENT '售后状态：0待审核 1同意退款 2拒绝退款 3完成',



    `result` VARCHAR(255) DEFAULT NULL
        COMMENT '审核结果说明',



    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT '申请时间',



    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
        COMMENT '更新时间',




    PRIMARY KEY (`id`),



    INDEX `idx_after_order`
    (`order_id`),



    INDEX `idx_after_status`
    (`status`),




    CONSTRAINT `fk_after_sale_order`

    FOREIGN KEY (`order_id`)

    REFERENCES `order`(`id`)



)

ENGINE=InnoDB

DEFAULT CHARSET=utf8mb4

COMMENT='商家售后审核表';








-- =====================================================================
-- 售后测试数据
-- =====================================================================


INSERT IGNORE INTO `after_sale`
(
    `id`,
    `order_id`,
    `user_id`,
    `type`,
    `reason`,
    `description`,
    `status`,
    `result`
)

VALUES



(
    1,
    1,
    1,
    'refund',
    '商品质量问题',
    '商品无法正常使用',
    0,
    NULL
),



(
    2,
    2,
    2,
    'return',
    '不喜欢',
    '申请退货退款',
    1,
    '商家同意退款'
);
