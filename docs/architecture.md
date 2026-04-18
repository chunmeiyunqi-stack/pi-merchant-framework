# 系统架构文档

> Pi Merchant Framework — 架构设计说明  
> 版本：v0.1.0

---

## 架构总览

```
┌──────────────────────────────────────────────────────────┐
│                    Pi Browser (客户端)                     │
│                                                          │
│  ┌─────────────────┐        ┌─────────────────────────┐  │
│  │   apps/web      │        │   apps/admin            │  │
│  │  商户前台       │        │  商户后台                │  │
│  │  Next.js 14     │        │  Next.js 14             │  │
│  │  :3000          │        │  :3001                  │  │
│  └────────┬────────┘        └───────────┬─────────────┘  │
└───────────┼─────────────────────────────┼────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────┐
│                  packages (共享层)                        │
│                                                         │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐            │
│  │  pi-sdk    │  │  config  │  │  types   │            │
│  │  支付/认证 │  │ 商户配置 │  │ 业务类型 │            │
│  └────────────┘  └──────────┘  └──────────┘            │
└───────────────────────────┬─────────────────────────────┘
                            │
            ┌───────────────┼──────────────────┐
            ▼               ▼                  ▼
     ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
     │  PostgreSQL │ │ Pi Platform  │ │   Vercel /   │
     │  数据库     │ │  API         │ │   Docker     │
     │  (Prisma)   │ │  api.minepi  │ │   部署       │
     └─────────────┘ └──────────────┘ └──────────────┘
```

---

## Monorepo 结构设计

本项目采用 **pnpm Workspace + Turborepo** 管理：

| 包 | 职责 | 依赖方向 |
|----|------|---------|
| `packages/types` | 业务类型定义 | 无依赖，被所有包引用 |
| `packages/pi-sdk` | Pi SDK 封装 | → types |
| `packages/config` | 商户配置 + 行业预设 | → types |
| `packages/ui` | 共用 UI 组件 | → types, config |
| `apps/web` | 商户前台 | → pi-sdk, config, ui, types |
| `apps/admin` | 商户后台 | → types, ui |

**依赖方向**：packages 之间只能向上依赖，apps 可以引用所有 packages。

---

## 数据库设计

### 核心关系图

```
merchants (1)
  ├─── merchant_users (N)   # 商户管理员
  ├─── customers (N)        # 顾客档案（按商户隔离）
  ├─── services (N)         # 服务目录
  ├─── orders (N)           # 订单
  │      └── payments (1)   # 关联支付记录
  ├─── bookings (N)         # 预约记录
  ├─── memberships (N)      # 会员方案定义
  │      └── customer_memberships (N)  # 已购会员
  └─── app_configs (1)      # 商户配置（一对一）
```

### 多租户设计

- 当前版本：**单租户**（DEFAULT_MERCHANT_ID 环境变量控制）
- 所有业务表均有 `merchant_id` 字段，自然支持多租户扩展
- 未来 SaaS 化只需在 API 层注入 `merchantId`，数据库无需改动

---

## 认证架构

```
前端                    后端               Pi Platform
 │                       │                     │
 │ Pi.authenticate()     │                     │
 │──────────────────►Pi SDK                    │
 │                       │                     │
 │◄──── authResult.accessToken                 │
 │                       │                     │
 │ POST /api/auth/pi     │                     │
 │ { accessToken }       │                     │
 │──────────────────►    │                     │
 │                       │ GET /v2/me          │
 │                       │ Bearer accessToken  │
 │                       │──────────────────►  │
 │                       │◄── { uid, username }│
 │                       │                     │
 │                       │ upsert customers    │
 │                       │ sign JWT            │
 │◄─── Set-Cookie: pi_session (HttpOnly JWT)   │
```

Session 存储：
- 后端签发 JWT，存入 **HttpOnly Cookie**（防 XSS）
- JWT Payload：`{ sub: customerId, piUid, username, merchantId }`
- 有效期：7 天

---

## 配置化架构

```
MerchantConfig (packages/config)
       │
       ├── modules.booking     → 控制预约模块显示/隐藏
       ├── modules.membership  → 控制会员模块
       ├── homepage.layout     → 决定首页布局顺序
       ├── industry.skin       → 控制主题色/UI 风格
       └── payment.checkoutMode → single/subscription
       │
       ▼
行业预设 (industry-presets.ts)
  beauty / fitness / education / consulting / generic
```

**核心约束**：所有行业差异通过 `MerchantConfig` 控制，禁止在业务代码中写死 `if skin === 'beauty'` 这样的判断。

---

## API 路由规范

### 状态码规范

| 场景 | 状态码 |
|------|--------|
| 成功 | 200 |
| 创建成功 | 201 |
| 参数错误 | 400 |
| 未认证 | 401 |
| 无权限 | 403 |
| 不存在 | 404 |
| Pi Platform 异常 | 502 |
| 服务器内部错误 | 500 |

### 响应体规范

```typescript
// 成功
{ success: true, data: T }

// 失败
{ success: false, error: string }
```

---

## 部署架构

### Vercel 部署（推荐）

```
vercel.com
  ├── pi-merchant-web.vercel.app     (apps/web)
  └── pi-merchant-admin.vercel.app   (apps/admin)

共享：
  └── Vercel Postgres / Supabase (DATABASE_URL)
```

### Docker 部署（自托管）

```dockerfile
# 参考：Dockerfile 待生成
# 每个 app 独立容器，共享同一 PostgreSQL 实例
```

---

## 扩展性设计

### P2：SaaS 多租户

只需：
1. 增加 `platform_admins` 表（平台管理员）
2. 增加 `tenant_plans` 表（订阅套餐）
3. 中间件层注入 `merchantId`（通过子域名或 URL 参数）

### P2：Pi 订阅合约

Pi 的订阅 (Subscription) API 直接集成到 `payment-service.ts`，不影响现有 U2A 流程。
