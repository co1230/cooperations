# 电商平台后台管理系统 - 前后端接口文档

> 项目：`E`（管理员后台：类目/品牌管理、用户封禁、商家审核、平台介入售后、系统日志监控）
> 后端：FastAPI + SQLAlchemy（异步）+ MySQL
> 前端：Vue 3 + Element Plus
> **数据库：与团队共用 `ecommerce` 库（对齐 A 任务 database/schema.sql）；本文档业务规则同时对齐 A 任务原型（mock-api.js / README）**

---

## 一、通用说明

### 1.1 基础信息

| 项目 | 说明 |
|---|---|
| 后端地址 | `http://localhost:8000`（FastAPI 接口文档：`http://localhost:8000/docs`） |
| 前端地址 | `http://localhost:5173`（开发环境通过 Vite 代理将 `/api` 转发到后端） |
| 数据格式 | 请求/响应均为 JSON，字符集 UTF-8 |

### 1.2 统一响应格式

所有接口（含业务错误）均返回以下结构：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

| code | 含义 |
|---|---|
| 200 | 成功 |
| 400 | 业务错误（参数不合法、状态不允许操作等），HTTP 状态码为 200 |
| 401 | 未登录 / 登录过期，HTTP 状态码为 401，前端自动跳转登录页 |
| 500 | 服务器内部错误 |

### 1.3 认证方式

除登录接口外，所有接口都需要在请求头携带 JWT 令牌：

```
Authorization: Bearer <token>
```

token 由登录接口返回，有效期 24 小时。

### 1.4 分页格式

分页接口统一使用 `page`（页码，从 1 开始）和 `page_size`（每页条数）参数，`data` 返回：

```json
{
  "total": 25,
  "list": []
}
```

---

## 二、管理员认证模块

> 对齐 A 任务：管理员是 `users` 表中 `role=ADMIN` 的账号（无独立 admin 表）。

### 2.1 管理员登录

| 项目 | 内容 |
|---|---|
| 方法 | POST |
| 路径 | `/api/admin/login` |
| 认证 | 否 |
| 描述 | 管理员登录，成功后返回 token 和管理员信息，并写入操作日志 |

**请求体：**

```json
{
  "username": "admin@demo.com",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 用户名或邮箱（1-120 字符） |
| password | string | 是 | 密码（1-255 字符） |

**业务规则：** 非 `ADMIN` 角色账号登录被拒绝（"该账号不是管理员账号"）；`DISABLED` 状态管理员被拒绝。

**响应示例：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "adminInfo": {
      "id": 1,
      "username": "admin",
      "email": "admin@demo.com",
      "role": "ADMIN"
    }
  }
}
```

### 2.2 获取当前管理员信息

| 项目 | 内容 |
|---|---|
| 方法 | GET |
| 路径 | `/api/admin/info` |
| 认证 | 是 |

---

## 三、类目管理模块

### 3.1 获取类目树

| 项目 | 内容 |
|---|---|
| 方法 | GET |
| 路径 | `/api/category/list` |
| 认证 | 是 |
| 描述 | 返回树形结构的全部类目（按排序值升序，最多三级） |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取类目列表成功",
  "data": [
    {
      "id": 1,
      "parent_id": 0,
      "name": "手机数码",
      "level": 1,
      "sort": 1,
      "status": 1,
      "created_at": "2026-08-26T10:00:00",
      "children": []
    }
  ]
}
```

### 3.2 新增类目

| 项目 | 内容 |
|---|---|
| 方法 | POST |
| 路径 | `/api/category/create` |
| 认证 | 是 |

**请求体：**

```json
{
  "parent_id": 0,
  "name": "家用电器",
  "sort": 3,
  "status": 1
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| parent_id | int | 否 | 父级类目ID，0 表示顶级类目，默认 0 |
| name | string | 是 | 类目名称（1-50 字符） |
| sort | int | 否 | 排序值，越小越靠前，默认 0 |
| status | int | 否 | 状态：1 启用 / 0 禁用，默认 1 |

**业务规则：** 父级类目必须存在；最多三级；同级下不允许重名。

### 3.3 修改类目

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/category/update/{category_id}` |
| 认证 | 是 |

**请求体（只更新传入的字段）：**

```json
{
  "name": "手机通讯",
  "sort": 2,
  "status": 0
}
```

### 3.4 删除类目

| 项目 | 内容 |
|---|---|
| 方法 | DELETE |
| 路径 | `/api/category/delete/{category_id}` |
| 认证 | 是 |
| 业务规则 | 该类目下存在子类目时不允许删除 |

---

## 四、品牌管理模块

### 4.1 品牌列表

| 项目 | 内容 |
|---|---|
| 方法 | GET |
| 路径 | `/api/brand/list` |
| 认证 | 是 |

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页条数，默认 10 |
| keyword | string | 否 | 品牌名称模糊搜索 |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取品牌列表成功",
  "data": {
    "total": 5,
    "list": [
      {
        "id": 1,
        "name": "华为",
        "logo": "https://example.com/logo.png",
        "description": "华为技术有限公司",
        "status": 1,
        "created_at": "2026-08-26T10:00:00"
      }
    ]
  }
}
```

### 4.2 新增品牌

| 项目 | 内容 |
|---|---|
| 方法 | POST |
| 路径 | `/api/brand/create` |
| 认证 | 是 |

**请求体：**

```json
{
  "name": "华为",
  "logo": "https://example.com/logo.png",
  "description": "华为技术有限公司",
  "status": 1
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| name | string | 是 | 品牌名称（1-50 字符，不可重复） |
| logo | string | 否 | Logo 图片 URL（≤255 字符） |
| description | string | 否 | 品牌描述（≤500 字符） |
| status | int | 否 | 状态：1 启用 / 0 禁用，默认 1 |

### 4.3 修改品牌

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/brand/update/{brand_id}` |
| 认证 | 是 |

### 4.4 删除品牌

| 项目 | 内容 |
|---|---|
| 方法 | DELETE |
| 路径 | `/api/brand/delete/{brand_id}` |
| 认证 | 是 |

---

## 五、用户管理模块

> 对齐 A 任务：用户表统一承载 BUYER/MERCHANT/ADMIN 三种身份；封禁 = `account_status → DISABLED`。

### 5.1 用户列表

| 项目 | 内容 |
|---|---|
| 方法 | GET |
| 路径 | `/api/admin/user/list` |
| 认证 | 是 |

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页条数，默认 10 |
| keyword | string | 否 | 用户名/邮箱/手机号模糊搜索 |
| role | string | 否 | 角色筛选：BUYER / MERCHANT / ADMIN |
| account_status | string | 否 | 状态筛选：ACTIVE / DISABLED / PENDING |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取用户列表成功",
  "data": {
    "total": 10,
    "list": [
      {
        "id": 6,
        "username": "wangwu",
        "email": "wangwu@demo.com",
        "phone": "13800000003",
        "avatar_url": null,
        "role": "BUYER",
        "account_status": "DISABLED",
        "ban_reason": "恶意刷单",
        "ban_until": null,
        "created_at": "2026-08-26T10:00:00"
      }
    ]
  }
}
```

> 注意：响应中不包含密码字段。

### 5.2 封禁用户

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/admin/user/ban/{user_id}` |
| 认证 | 是 |

**请求体：**

```json
{
  "ban_reason": "恶意刷单",
  "ban_duration_hours": 168,
  "close_unpaid_orders": false
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| ban_reason | string | 是 | 封禁原因（1-255 字符） |
| ban_duration_hours | int | 否 | 封禁时长（小时），**0 表示永久封禁**，默认 0 |
| close_unpaid_orders | bool | 否 | 是否同时关闭该用户的待付款订单，默认 false |

**业务规则（对齐 A 任务）：**

- 管理员账号（role=ADMIN）**受保护**，不能封禁；
- 仅 ACTIVE 状态可封禁（PENDING 待审核、DISABLED 已封禁均拒绝）；
- 封禁只阻断"新交易能力"，不影响存量业务（资金安全优先）——已付款/已发货订单继续履约，售后单继续处理；
- `close_unpaid_orders=true` 时，该用户 PENDING_PAYMENT 订单 → CLOSED，并在日志中记录数量。

> 补充：封禁时长到期的用户，由后端定时任务（每 30 秒扫描）自动解封并写入系统日志（操作类型：`封禁到期自动解封`）；永久封禁（时长 0）不会被自动解封。

### 5.3 解封用户

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/admin/user/unban/{user_id}` |
| 认证 | 是 |

**业务规则（对齐 A 任务）：**

- 管理员账号受保护，不能操作；
- **待审核账号不能通过解封绕过审核**（PENDING 状态拒绝解封）；
- 仅 DISABLED 状态可解封。

---

## 六、商家审核模块

> 对齐 A 任务：管理员"商家审核"——预置待审核商家申请，通过后开通商家登录，拒绝必须填写原因。

### 6.1 商家入驻申请列表

| 项目 | 内容 |
|---|---|
| 方法 | GET |
| 路径 | `/api/admin/merchant/applications` |
| 认证 | 是 |

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页条数，默认 10 |
| account_status | string | 否 | 状态筛选：PENDING（默认）/ ACTIVE / 空（全部） |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取商家入驻申请成功",
  "data": {
    "total": 2,
    "list": [
      {
        "id": 9,
        "username": "apply1",
        "email": "apply1@demo.com",
        "account_status": "PENDING",
        "merchant_application": {
          "shop_name": "山茶手作",
          "contact": "李雷",
          "description": "主营手作陶瓷与茶具",
          "applied_at": "2026-08-20T10:00:00",
          "review": null
        },
        "created_at": "2026-08-26T10:00:00"
      }
    ]
  }
}
```

### 6.2 通过入驻申请

| 项目 | 内容 |
|---|---|
| 方法 | POST |
| 路径 | `/api/admin/merchant/approve/{user_id}` |
| 认证 | 是 |
| 描述 | 待审核 → ACTIVE，商家开通登录；审核结果（操作人/时间）写入 `merchant_application.review` |

**业务规则：** 仅 role=MERCHANT 且 PENDING 状态可审核；已审核的申请不可重复审核。

### 6.3 驳回入驻申请

| 项目 | 内容 |
|---|---|
| 方法 | POST |
| 路径 | `/api/admin/merchant/reject/{user_id}` |
| 认证 | 是 |

**请求体：**

```json
{
  "remark": "资质不全，请补充营业执照"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| remark | string | 是 | 驳回原因（1-200 字） |

**业务规则：** 驳回后保持 PENDING 状态（不可登录），审核记录写入 `merchant_application.review`；不可重复审核。

---

## 七、售后介入模块

> 对齐 A 任务：售后工单 `after_sale_tickets` 状态机与平台介入规则（mock-api.js 的 canIntervene/interveneRefund）。
> E 扩展：`deadline` 超时自动介入（定时任务）、`is_platform_intervened`、`platform_intervention` 处理记录。

### 7.1 售后工单列表

| 项目 | 内容 |
|---|---|
| 方法 | GET |
| 路径 | `/api/after-sale/list` |
| 认证 | 是 |

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页条数，默认 10 |
| status | string | 否 | 工单状态：APPLIED/PROCESSING/APPROVED/REJECTED/BUYER_SHIPPED/REFUNDING/COMPLETED/CLOSED |
| type | string | 否 | 工单类型：REFUND_ONLY / RETURN_REFUND / EXCHANGE |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取售后工单列表成功",
  "data": {
    "total": 5,
    "list": [
      {
        "id": 1,
        "ticket_no": "AS20260826001",
        "order_no": "E20260826001",
        "product_name": "手冲咖啡分享壶",
        "buyer_name": "zhangsan",
        "user_account_status": "ACTIVE",
        "ticket_type": "REFUND_ONLY",
        "reason": "质量问题",
        "requested_amount": 128.0,
        "merchant_reply": null,
        "status": "APPLIED",
        "deadline": "2026-08-29T14:00:00",
        "is_platform_intervened": false,
        "platform_intervention": null,
        "is_overdue": false,
        "can_force_refund": true,
        "can_reject": true,
        "created_at": "2026-08-27T10:00:00"
      }
    ]
  }
}
```

> `can_force_refund` / `can_reject` 由后端按 A 任务的 canIntervene 规则实时计算，前端直接按标记渲染按钮：
>
> - 已被平台处理过（platform_intervention 非空）/ 订单已退款 / 订单履约状态不在 (PAID, SHIPPED, COMPLETED) / 存在更新的工单 → 均不可介入；
> - 强制退款允许工单状态 ∈ (APPLIED, PROCESSING, APPROVED, **REJECTED**)（可覆盖商家已拒绝的最新申请）；
> - 驳回允许工单状态 ∈ (APPLIED, PROCESSING, APPROVED)。
> - `is_overdue` 为后端实时计算：待审核且已过 `deadline`。
> - `user_account_status` 为买家账号状态，DISABLED 时前端标记"已封禁"。

### 7.2 售后工单状态统计

| 项目 | 内容 |
|---|---|
| 方法 | GET |
| 路径 | `/api/after-sale/stats` |
| 认证 | 是 |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取售后统计成功",
  "data": {
    "pending": 1,
    "overdue": 0,
    "processing": 2,
    "completed": 1,
    "closed": 1
  }
}
```

### 7.3 平台介入

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/after-sale/intervene/{ticket_id}` |
| 认证 | 是 |
| 描述 | 工单 APPLIED → PROCESSING，订单售后状态同步 → PROCESSING，写状态变更日志 |

**业务规则：** 仅待审核（APPLIED）且未被平台介入过的工单可手动介入；超时工单由定时任务自动介入。

### 7.4 强制退款

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/after-sale/refund/{ticket_id}` |
| 认证 | 是 |

**请求体（原因必填）：**

```json
{
  "reason": "平台核实商家违约，强制退款"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| reason | string | 是 | 平台处理原因（**1-200 字**） |

**业务规则（对齐 A 任务 interveneRefund 的 FORCE_REFUND 分支）：**

1. 原因必填（1-200 字）；
2. 已被平台处理过的工单不能重复介入；订单已退款不能重复退款；
3. 订单履约状态须 ∈ (PAID, SHIPPED, COMPLETED)；
4. 存在更新的工单时拒绝（提示处理最新工单）；
5. 工单状态须 ∈ (APPLIED, PROCESSING, APPROVED, REJECTED)——**可覆盖商家已拒绝的最新申请**；
6. 工单退款金额必须有效（>0 且 ≤ 订单金额）；
7. 执行效果：工单 → COMPLETED（写入 platform_intervention 处理记录）；订单 `after_sale_status` → REFUNDED（**履约状态 order_status 不变**）；全额退款时支付流水 SUCCESS → REFUNDED；写订单售后状态变更日志。

### 7.5 驳回申请（关闭争议）

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/after-sale/close/{ticket_id}` |
| 认证 | 是 |

**请求体（原因必填）：**

```json
{
  "reason": "证据不足，驳回申请"
}
```

**业务规则（对齐 A 任务 interveneRefund 的 REJECT 分支）：**

1. 原因必填（1-200 字）；
2. 工单状态须 ∈ (APPLIED, PROCESSING, APPROVED)——商家已驳回（REJECTED）的工单不可再驳回，但可强制退款；
3. 执行效果：工单 → REJECTED；订单 `after_sale_status` → REJECTED；**不产生退款记录、不动支付流水**；写状态变更日志。

### 7.6 后端定时任务（非接口）

| 任务 | 间隔 | 逻辑 |
|---|---|---|
| 售后超时自动介入 | 30 秒 | APPLIED 且 `deadline` 已过 → PROCESSING，同步订单售后状态，写系统日志+状态变更日志 |
| 封禁到期自动解封 | 30 秒 | DISABLED 且 `ban_until` 已过（非管理员）→ ACTIVE，清空封禁字段，写系统日志 |

---

## 八、日志监控模块

### 8.1 操作日志列表

| 项目 | 内容 |
|---|---|
| 方法 | GET |
| 路径 | `/api/log/list` |
| 认证 | 是 |

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页条数，默认 10 |
| admin_name | string | 否 | 操作人名称，模糊匹配 |
| action | string | 否 | 操作类型，精确匹配 |
| start_time | datetime | 否 | 开始时间，格式 `YYYY-MM-DD HH:mm:ss` |
| end_time | datetime | 否 | 结束时间，格式 `YYYY-MM-DD HH:mm:ss` |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取日志列表成功",
  "data": {
    "total": 3,
    "list": [
      {
        "id": 5,
        "admin_id": 0,
        "admin_name": "系统",
        "action": "超时自动介入",
        "target_type": "after_sale",
        "target_id": 2,
        "detail": "售后工单 AS20260825001 超过处理时限未处理，系统自动标记平台介入",
        "ip": null,
        "created_at": "2026-08-28T14:00:00"
      }
    ]
  }
}
```

### 8.2 日志统计

| 项目 | 内容 |
|---|---|
| 方法 | GET |
| 路径 | `/api/log/stats` |
| 认证 | 是 |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取日志统计成功",
  "data": {
    "today_count": 12,
    "total_count": 56
  }
}
```

---

## 九、附录

### 9.1 操作类型（action）枚举

| 操作类型 | 触发场景 | admin_id |
|---|---|---|
| 管理员登录 | 管理员登录系统 | 管理员ID |
| 新增类目 / 修改类目 / 删除类目 | 类目管理操作 | 管理员ID |
| 新增品牌 / 修改品牌 / 删除品牌 | 品牌管理操作 | 管理员ID |
| 封禁用户 / 解封用户 | 用户管理操作 | 管理员ID |
| 商家审核通过 / 商家审核驳回 | 商家审核操作 | 管理员ID |
| 平台介入 / 强制退款 / 关闭争议 | 售后介入操作 | 管理员ID |
| 超时自动介入 / 封禁到期自动解封 | 定时任务自动触发 | 0（系统） |

### 9.2 售后工单状态枚举（对齐 A 任务）

| 值 | 含义 |
|---|---|
| APPLIED | 待审核（买家已申请） |
| PROCESSING | 处理中（平台介入中） |
| APPROVED | 已同意（商家同意） |
| REJECTED | 已驳回（商家或平台驳回） |
| BUYER_SHIPPED | 买家已寄回（退货退款流程） |
| REFUNDING | 退款中 |
| COMPLETED | 已退款（完成） |
| CLOSED | 已关闭 |

### 9.3 订单状态枚举（对齐 A 任务）

| 值 | 含义 |
|---|---|
| PENDING_PAYMENT | 待付款 |
| PAID | 已付款（待发货） |
| SHIPPED | 已发货 |
| COMPLETED | 已完成 |
| CANCELLED | 已取消 |
| CLOSED | 已关闭 |

> 订单的 `order_status`（履约主流程）与 `after_sale_status`（售后流程）为两个独立字段，业务上互不覆盖——平台强制退款只改售后状态与支付流水，不动履约状态。

### 9.4 账号状态枚举（对齐 A 任务）

| 值 | 含义 |
|---|---|
| ACTIVE | 正常 |
| DISABLED | 封禁 |
| PENDING | 待审核（商家入驻申请） |
