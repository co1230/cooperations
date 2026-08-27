# E - 电商平台管理员后台系统

电商网站系统的管理员后台管理端，包含四大模块：**平台类目/品牌管理、用户封禁/管理、平台介入售后（超时自动触发、强制退款/关闭争议）、系统日志监控**。

## 技术栈

| 端 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + Element Plus + Pinia + Vue Router + Axios |
| 后端 | FastAPI + SQLAlchemy 2.0（异步）+ aiomysql + APScheduler + PyJWT |
| 数据库 | MySQL 8.x（ORM 自动建表 + 手动 SQL 脚本双支持） |
| 数据校验 | Pydantic v2 |

## 目录结构

```
E/
├── backend/                 # FastAPI 后端
│   ├── main.py              # 入口：自动建表、预置管理员、启动定时任务
│   ├── requirements.txt     # Python 依赖
│   ├── config/              # 配置（数据库连接、会话）
│   ├── models/              # SQLAlchemy ORM 模型（7 张表）
│   ├── schemas/             # Pydantic 数据校验类
│   ├── crud/                # 数据库操作层
│   ├── routers/             # API 路由（认证/类目/品牌/用户/售后/日志）
│   ├── tasks/               # 定时任务（售后超时自动介入，每 30 秒）
│   ├── utils/               # 工具（JWT鉴权/密码加密/统一响应/异常处理）
│   └── sql/init.sql         # MySQL 建库建表脚本（含演示数据）
├── frontend/                # Vue 3 前端
│   └── src/
│       ├── api/             # axios 封装 + 各模块接口
│       ├── views/           # 登录/布局/类目/品牌/用户/售后/日志 7 个页面
│       ├── router/          # 路由（含登录守卫）
│       └── store/           # Pinia 状态管理
└── docs/                    # 文档
    ├── API接口文档.md        # 前后端接口文档
    ├── 数据库建表SQL.md      # 建表 SQL 文档（含表结构说明）
    └── 运行方式.md           # 运行方式与常见问题
```

## 快速开始

1. **数据库**：执行 `backend/sql/init.sql`（或直接启动后端自动建表）
2. **后端**：`cd backend` → `pip install -r requirements.txt` → `uvicorn main:app --reload --port 8000`
3. **前端**：`cd frontend` → `npm install` → `npm run dev` → 访问 http://localhost:5173
4. **登录**：admin / 123456

详细说明见 [docs/运行方式.md](docs/运行方式.md)，接口说明见 [docs/API接口文档.md](docs/API接口文档.md)。

## 核心功能

- **类目/品牌管理**：三级树形类目、品牌 CRUD、启用/禁用、分页搜索
- **用户封禁**：按原因+时长封禁（支持永久）、可选同时关闭待付款订单（存量已付款订单/售后单不受影响）、封禁到期自动解封（定时任务）、手动解封，全部操作留痕；售后列表自动标记"申请人已封禁"
- **售后介入**：超时未处理自动触发平台介入（APScheduler 定时扫描）、管理员手动介入、强制退款（同步更新订单）、关闭争议
- **日志监控**：所有管理员操作与系统自动操作留痕，支持多条件筛选和统计
