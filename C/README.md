# C 交易流程模块

C 是购物车、结算、订单、模拟支付和售后申请的唯一交易数据源。它使用 A 定义的 `ecommerce` 数据库，并与 E 共享订单/售后表。

## 运行

1. 先启动 MySQL 8，默认连接为 `root:123456@127.0.0.1:3306/ecommerce`。
2. 在 `C/backend` 中执行：

   ```powershell
   python -m pip install -r requirements.txt
   python -m uvicorn main:app --host 127.0.0.1 --port 8002
   ```

   Windows 也可在 `C` 目录直接执行 `powershell -ExecutionPolicy Bypass -File .\start.ps1`。

3. 接口文档：`http://127.0.0.1:8002/docs`，健康检查：`http://127.0.0.1:8002/api/health`。

## 联动关系

- B Web/小程序：调用 `/api/cart`、`/api/orders`、`/api/payments`。
- D 商家端：调用 `/trade-api/order` 发货，调用 `/trade-api/after-sale` 审核售后。
- E 平台端：直接从共享的 `orders`、`payment_records`、`after_sale_tickets` 表管理平台介入。
- A 集成器：将 B 的 `/api` 和 D 的 `/trade-api` 代理到 C:8002。

`X-User-Id` / `X-Merchant-Id` 是本地演示身份头。生产环境必须由 A 的 JWT/RBAC 校验后注入，不能相信浏览器自行填写的值。

为避免 A 的本地用户 ID 与 E 的管理员种子 ID 冲突，C 将 A 买家 ID 映射到 `2000000000 + A_ID` 的交易命名空间。
