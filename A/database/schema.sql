-- MySQL 8.0+
CREATE DATABASE IF NOT EXISTS ecommerce
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE ecommerce;

CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT '仅存储 Argon2/bcrypt 哈希',
  role ENUM('BUYER', 'MERCHANT', 'ADMIN') NOT NULL DEFAULT 'BUYER' COMMENT '用户身份',
  phone VARCHAR(20) NULL,
  avatar_url VARCHAR(500) NULL,
  account_status ENUM('ACTIVE', 'DISABLED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_role_status (role, account_status)
) ENGINE=InnoDB COMMENT='用户表';

CREATE TABLE products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '所属商家',
  name VARCHAR(160) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  cover_url VARCHAR(500) NULL,
  product_status ENUM('DRAFT', 'ON_SALE', 'OFF_SALE') NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_merchant FOREIGN KEY (merchant_id) REFERENCES users(id),
  UNIQUE KEY uk_products_sku (sku),
  KEY idx_products_merchant_status (merchant_id, product_status)
) ENGINE=InnoDB COMMENT='商品表';

CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL COMMENT '对外订单号',
  buyer_id BIGINT UNSIGNED NOT NULL,
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '单商家订单，便于商家隔离数据',
  total_amount DECIMAL(12,2) UNSIGNED NOT NULL,
  order_status ENUM('PENDING_PAYMENT','PAID','SHIPPED','COMPLETED','CANCELLED','CLOSED')
    NOT NULL DEFAULT 'PENDING_PAYMENT' COMMENT '订单状态：支付及履约主流程',
  after_sale_status ENUM('NONE','APPLIED','PROCESSING','APPROVED','REJECTED','REFUNDING','REFUNDED','CLOSED')
    NOT NULL DEFAULT 'NONE' COMMENT '售后状态：退款/退货流程，与订单状态独立',
  receiver_name VARCHAR(50) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  receiver_address VARCHAR(500) NOT NULL,
  paid_at DATETIME NULL,
  shipped_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
  CONSTRAINT fk_orders_merchant FOREIGN KEY (merchant_id) REFERENCES users(id),
  UNIQUE KEY uk_orders_order_no (order_no),
  KEY idx_orders_buyer_created (buyer_id, created_at),
  KEY idx_orders_merchant_status (merchant_id, order_status),
  KEY idx_orders_after_sale (after_sale_status)
) ENGINE=InnoDB COMMENT='订单表';

CREATE TABLE order_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  product_name VARCHAR(160) NOT NULL COMMENT '下单时商品名称快照',
  sku VARCHAR(64) NOT NULL COMMENT '下单时 SKU 快照',
  unit_price DECIMAL(12,2) UNSIGNED NOT NULL COMMENT '下单时单价快照',
  quantity INT UNSIGNED NOT NULL,
  subtotal DECIMAL(12,2) UNSIGNED NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  KEY idx_items_order (order_id)
) ENGINE=InnoDB COMMENT='订单明细表';

CREATE TABLE shopping_carts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  buyer_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
  UNIQUE KEY uk_carts_buyer (buyer_id)
) ENGINE=InnoDB COMMENT='购物车表';

CREATE TABLE cart_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  cart_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  selected TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY uk_cart_product (cart_id, product_id)
) ENGINE=InnoDB COMMENT='购物车商品表';

CREATE TABLE user_addresses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  buyer_id BIGINT UNSIGNED NOT NULL,
  receiver_name VARCHAR(50) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  province VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  district VARCHAR(50) NOT NULL,
  detail_address VARCHAR(300) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
  KEY idx_addresses_buyer (buyer_id)
) ENGINE=InnoDB COMMENT='用户收货地址表';

CREATE TABLE payment_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  payment_no VARCHAR(40) NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) UNSIGNED NOT NULL,
  payment_method ENUM('ALIPAY','WECHAT','BANK_CARD','MOCK') NOT NULL,
  payment_status ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  third_party_trade_no VARCHAR(100) NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_payments_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
  UNIQUE KEY uk_payments_payment_no (payment_no),
  KEY idx_payments_order (order_id)
) ENGINE=InnoDB COMMENT='支付流水表';

CREATE TABLE after_sale_tickets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ticket_no VARCHAR(40) NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  merchant_id BIGINT UNSIGNED NOT NULL,
  ticket_type ENUM('REFUND_ONLY','RETURN_REFUND','EXCHANGE') NOT NULL,
  status ENUM('APPLIED','PROCESSING','APPROVED','REJECTED','BUYER_SHIPPED','REFUNDING','COMPLETED','CLOSED') NOT NULL DEFAULT 'APPLIED',
  reason VARCHAR(200) NOT NULL,
  description TEXT NULL,
  evidence_urls JSON NULL,
  requested_amount DECIMAL(12,2) UNSIGNED NULL,
  merchant_reply VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_tickets_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_tickets_item FOREIGN KEY (order_item_id) REFERENCES order_items(id),
  CONSTRAINT fk_tickets_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
  CONSTRAINT fk_tickets_merchant FOREIGN KEY (merchant_id) REFERENCES users(id),
  UNIQUE KEY uk_tickets_ticket_no (ticket_no),
  KEY idx_tickets_buyer_status (buyer_id, status),
  KEY idx_tickets_merchant_status (merchant_id, status)
) ENGINE=InnoDB COMMENT='售后工单表';

CREATE TABLE order_status_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  operator_id BIGINT UNSIGNED NULL,
  status_type ENUM('ORDER','AFTER_SALE') NOT NULL,
  from_status VARCHAR(30) NULL,
  to_status VARCHAR(30) NOT NULL,
  remark VARCHAR(300) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_logs_operator FOREIGN KEY (operator_id) REFERENCES users(id),
  KEY idx_logs_order_created (order_id, created_at)
) ENGINE=InnoDB COMMENT='订单及售后状态变更日志';
