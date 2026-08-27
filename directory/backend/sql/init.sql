-- =====================================================================
-- 成员D：商家后台数据库初始化脚本
-- 数据库：e_shop_admin
--
-- 模块：
-- 1. 商品管理 product
-- 2. 商家订单管理 order
-- 3. 商家售后审核 after_sale
--
-- 说明：
-- 1. 依赖成员E已有：
--    category 表
--    brand 表
--
-- 2. 不重复创建分类和品牌表
-- =====================================================================


USE `e_shop_admin`;



-- =====================================================================
-- 一、商品表 product
-- =====================================================================


CREATE TABLE IF NOT EXISTS `product` (

    `id` INT NOT NULL AUTO_INCREMENT COMMENT '商品ID',

    `category_id` INT NOT NULL COMMENT '商品所属类目ID',

    `brand_id` INT NOT NULL COMMENT '商品所属品牌ID',

    `name` VARCHAR(100) NOT NULL COMMENT '商品名称',

    `description` VARCHAR(500) DEFAULT NULL COMMENT '商品描述',

    `price` DECIMAL(10,2) NOT NULL COMMENT '商品售价',

    `stock` INT NOT NULL DEFAULT 0 COMMENT '商品库存',

    `image` VARCHAR(255) DEFAULT NULL COMMENT '商品图片',

    `status` INT NOT NULL DEFAULT 1 COMMENT '状态 1上架 0下架',


    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    PRIMARY KEY (`id`),

    INDEX `idx_product_category`
    (`category_id`),

    INDEX `idx_product_brand`
    (`brand_id`),

    INDEX `idx_product_status`
    (`status`)


)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COMMENT='商品管理表';




-- 商品测试数据

INSERT IGNORE INTO `product`
(
id,
category_id,
brand_id,
name,
description,
price,
stock,
image,
status
)

VALUES

(
1,
1,
1,
'苹果手机',
'旗舰智能手机',
7999,
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
5999,
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
399,
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



    `order_no` VARCHAR(50)
    NOT NULL UNIQUE
    COMMENT '订单编号',



    `user_id` INT NOT NULL
    COMMENT '购买用户ID',



    `product_id` INT NOT NULL
    COMMENT '商品ID',



    `product_name`
    VARCHAR(255)
    NOT NULL
    COMMENT '商品名称',



    `quantity`
    INT NOT NULL DEFAULT 1
    COMMENT '购买数量',



    `total_amount`
    DECIMAL(10,2)
    NOT NULL
    COMMENT '订单金额',



    `status`
    INT NOT NULL DEFAULT 1
    COMMENT '
    0待付款
    1待发货
    2已发货
    3已完成
    4已退款
    ',



    `express_company`
    VARCHAR(100)
    DEFAULT NULL
    COMMENT '物流公司',



    `tracking_number`
    VARCHAR(100)
    DEFAULT NULL
    COMMENT '物流单号',



    `shipped_at`
    DATETIME
    DEFAULT NULL
    COMMENT '发货时间',



    `created_at`
    DATETIME
    NOT NULL DEFAULT CURRENT_TIMESTAMP,



    `updated_at`
    DATETIME
    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    PRIMARY KEY(id),


    INDEX idx_order_status(status),

    INDEX idx_order_user(user_id)



)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COMMENT='商家订单表';







-- 订单测试数据


INSERT IGNORE INTO `order`
(
id,
order_no,
user_id,
product_id,
product_name,
quantity,
total_amount,
status
)

VALUES

(
1,
'ORD20260001',
1,
1,
'苹果手机',
1,
7999,
1
),


(
2,
'ORD20260002',
2,
2,
'华为笔记本',
1,
5999,
2
),


(
3,
'ORD20260003',
3,
3,
'运动鞋',
2,
798,
3
);







-- =====================================================================
-- 三、商家售后审核表 after_sale
-- =====================================================================


CREATE TABLE IF NOT EXISTS `after_sale`
(


    `id`
    INT NOT NULL AUTO_INCREMENT
    COMMENT '售后ID',



    `order_id`
    INT NOT NULL
    COMMENT '订单ID',



    `user_id`
    INT NOT NULL
    COMMENT '申请用户ID',



    `type`
    VARCHAR(20)
    NOT NULL
    COMMENT 'refund退款 return退货',



    `reason`
    VARCHAR(255)
    NOT NULL
    COMMENT '申请原因',



    `description`
    VARCHAR(500)
    DEFAULT NULL
    COMMENT '问题描述',



    `status`
    INT NOT NULL DEFAULT 0
    COMMENT '
    0待审核
    1同意退款
    2拒绝退款
    3完成
    ',



    `result`
    VARCHAR(255)
    DEFAULT NULL
    COMMENT '审核结果',



    `created_at`
    DATETIME
    NOT NULL DEFAULT CURRENT_TIMESTAMP,



    `updated_at`
    DATETIME
    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    PRIMARY KEY(id),


    INDEX idx_after_order(order_id),


    INDEX idx_after_status(status)



)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COMMENT='商家售后审核表';





-- 售后测试数据


INSERT IGNORE INTO `after_sale`
(
id,
order_id,
user_id,
type,
reason,
description,
status
)

VALUES


(
1,
1,
1,
'refund',
'商品质量问题',
'无法正常使用',
0
),


(
2,
2,
2,
'return',
'不喜欢',
'申请退货',
1
);





-- =====================================================================
-- 完成
-- =====================================================================

