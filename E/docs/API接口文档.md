# 电商平台后台管理系统 - 前后端接口文档

> 项目：`E`（管理员后台：类目/品牌管理、用户封禁、平台介入售后、系统日志监控）
> 后端：FastAPI + SQLAlchemy（异步）+ MySQL
> 前端：Vue 3 + Element Plus

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
  "username": "admin",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 用户名（1-50 字符） |
| password | string | 是 | 密码（1-255 字符） |

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
      "role": "super"
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

**响应示例：**

```json
{
  "code": 200,
  "message": "获取管理员信息成功",
  "data": {
    "id": 1,
    "username": "admin",
    "role": "super"
  }
}
```

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
      "children": [
        {
          "id": 3,
          "parent_id": 1,
          "name": "手机",
          "level": 2,
          "sort": 1,
          "status": 1,
          "created_at": "2026-08-26T10:00:00",
          "children": []
        }
      ]
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

**请求体（只更新传入的字段）：**

```json
{
  "name": "华为",
  "logo": "https://example.com/new-logo.png",
  "description": "更新后的描述",
  "status": 1
}
```

### 4.4 删除品牌

| 项目 | 内容 |
|---|---|
| 方法 | DELETE |
| 路径 | `/api/brand/delete/{brand_id}` |
| 认证 | 是 |

---

## 五、用户管理模块

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
| keyword | string | 否 | 用户名/昵称/手机号模糊搜索 |
| status | int | 否 | 账号状态筛选：0 正常 / 1 封禁 |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取用户列表成功",
  "data": {
    "total": 5,
    "list": [
      {
        "id": 3,
        "username": "wangwu",
        "nickname": "王五",
        "avatar": null,
        "phone": "13800000003",
        "status": 1,
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

**业务规则：** 已被封禁的用户不能重复封禁。

> 补充：封禁时长到期的用户，由后端定时任务（每 30 秒扫描）自动解封并写入系统日志（操作类型：`封禁到期自动解封`）；永久封禁（时长 0）不会被自动解封。

> 补充2（存量业务联动）：封禁只阻断"新交易能力"，不影响存量业务（资金安全优先）——已付款/已发货订单继续履约，售后单继续处理；待付款订单仅在 `close_unpaid_orders=true` 时由系统关闭（状态 → 5）。

### 5.3 解封用户

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/admin/user/unban/{user_id}` |
| 认证 | 是 |
| 描述 | 解除封禁，清空封禁原因和封禁截止时间 |

---

## 六、售后介入模块

### 6.1 售后单列表

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
| status | int | 否 | 状态筛选：0 待处理 / 1 平台已介入 / 2 已完成 / 3 已关闭 |
| type | string | 否 | 类型筛选：return 退货 / refund 退款 |

**响应示例：**

```json
{
  "code": 200,
  "message": "获取售后单列表成功",
  "data": {
    "total": 5,
    "list": [
      {
        "id": 2,
        "after_sale_no": "AS20260802001",
        "order_no": "E20260803001",
        "product_name": "苹果 iPhone 16 Pro",
        "username": "zhaoliu",
        "user_status": 0,
        "type": "return",
        "reason": "七天无理由退货",
        "status": 0,
        "deadline": "2026-08-26T18:00:00",
        "is_platform_intervened": false,
        "is_overdue": true,
        "result": null,
        "created_at": "2026-08-25T10:00:00"
      }
    ]
  }
}
```

> `is_overdue` 为后端实时计算：状态为待处理且已过 `deadline` 时为 `true`。
> `user_status` 为申请人账号状态（0 正常 / 1 封禁），前端据此标记"申请人已封禁"；封禁不影响其存量售后单的继续处理。

### 6.2 售后单状态统计

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
    "pending": 2,
    "overdue": 1,
    "intervened": 1,
    "completed": 1,
    "closed": 1
  }
}
```

### 6.3 平台介入

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/after-sale/intervene/{after_sale_id}` |
| 认证 | 是 |
| 描述 | 管理员手动介入，售后单状态：0 待处理 → 1 平台已介入 |

**业务规则：** 仅待处理状态可介入。

### 6.4 强制退款

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/after-sale/refund/{after_sale_id}` |
| 认证 | 是 |
| 描述 | 售后单状态 → 2 已完成，关联订单状态同步更新为 4（已退款） |

**请求体（可选）：**

```json
{
  "result": "管理员强制退款"
}
```

**业务规则：** 仅待处理 / 平台已介入状态可退款；订单已退款（状态 4）不可重复退款；订单为待付款（0）或已关闭（5）时不允许退款。

### 6.5 关闭争议

| 项目 | 内容 |
|---|---|
| 方法 | PUT |
| 路径 | `/api/after-sale/close/{after_sale_id}` |
| 认证 | 是 |
| 描述 | 售后单状态 → 3 已关闭 |

**请求体（可选）：**

```json
{
  "result": "证据不足，关闭争议"
}
```

**业务规则：** 仅待处理 / 平台已介入状态可关闭。

### 6.6 超时自动介入（后端定时任务，非接口）

后端启动后，APScheduler 定时任务每 **30 秒**扫描一次售后单表：状态为 0（待处理）且 `deadline` 已过的售后单，自动置为 1（平台已介入）、`is_platform_intervened = true`，并写入一条操作人为「系统」的日志（操作类型：`超时自动介入`）。前端无需轮询即可在刷新列表时看到状态变化。

---

## 七、日志监控模块

### 7.1 操作日志列表

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
        "id": 3,
        "admin_id": 0,
        "admin_name": "系统",
        "action": "超时自动介入",
        "target_type": "after_sale",
        "target_id": 2,
        "detail": "售后单 AS20260802001 超过处理时限未处理，系统自动标记平台介入",
        "ip": null,
        "created_at": "2026-08-27T08:30:00"
      }
    ]
  }
}
```

### 7.2 日志统计

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

## 八、附录

### 8.1 操作类型（action）枚举

| 操作类型 | 触发场景 | admin_id |
|---|---|---|
| 管理员登录 | 管理员登录系统 | 管理员ID |
| 新增类目 / 修改类目 / 删除类目 | 类目管理操作 | 管理员ID |
| 新增品牌 / 修改品牌 / 删除品牌 | 品牌管理操作 | 管理员ID |
| 封禁用户 / 解封用户 | 用户管理操作 | 管理员ID |
| 平台介入 / 强制退款 / 关闭争议 | 售后介入操作 | 管理员ID |
| 超时自动介入 | 定时任务自动触发 | 0（系统） |
| 封禁到期自动解封 | 定时任务自动触发（封禁时长到期） | 0（系统） |

### 8.2 售后单状态枚举

| 值 | 含义 |
|---|---|
| 0 | 待处理 |
| 1 | 平台已介入 |
| 2 | 已完成（已退款） |
| 3 | 已关闭（争议关闭） |

### 8.3 订单状态枚举（简化版）

| 值 | 含义 |
|---|---|
| 0 | 待付款 |
| 1 | 已付款 |
| 2 | 已发货 |
| 3 | 已完成 |
| 4 | 已退款 |
| 5 | 已关闭 |
