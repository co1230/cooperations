-- =====================================================================
-- 成员D：商品管理模块数据库初始化脚本
-- 数据库：e_shop_admin
-- 模块：product 商品表
--
-- 说明：
-- 1. 依赖成员E已有：
--    category 表
--    brand 表
--
-- 2. 商品通过 category_id、brand_id 关联已有数据
-- 3. 不创建新的分类和品牌表
-- =====================================================================


USE `e_shop_admin`;


-- ---------------------------------------------------------------------
-- 商品表
-- ---------------------------------------------------------------------

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
        (`status`)


) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COMMENT='商品管理表';



-- ---------------------------------------------------------------------
-- 商品演示数据
-- ---------------------------------------------------------------------

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
    'iPhone 16 Pro',
    '苹果旗舰智能手机',
    7999.00,
    100,
    'https://example.com/iphone16.jpg',
    1
),


(
    2,
    1,
    2,
    '华为 MateBook',
    '轻薄办公笔记本电脑',
    5999.00,
    50,
    'https://example.com/matebook.jpg',
    1
),


(
    3,
    2,
    3,
    '运动鞋',
    '男女款运动休闲鞋',
    399.00,
    200,
    'https://example.com/shoes.jpg',
    0
);
