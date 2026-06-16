# Pioneer AI 智能商户服务框架 — 用户手册 V2.0.0

**软件名称：** 先锋人工智能服务框架软件（Pioneer AI Merchant Framework）
**版本号：** V2.0.0
**著作权人：** 秦晓望
**编制日期：** 2026年05月
**文档密级：** 内部公开

---

# 目录

1. [系统概述](#1-系统概述)
2. [安装与部署](#2-安装与部署)
3. [技术架构](#3-技术架构)
4. [核心功能模块](#4-核心功能模块)
5. [商业核心能力（V2.0.0 新增）](#5-商业核心能力-v200-新增)
6. [API 接口参考](#6-api-接口参考)
7. [运维管理](#7-运维管理)
8. [常见问题](#8-常见问题)

---

# 1 系统概述

## 1.1 系统简介

Pioneer AI 智能商户服务框架（以下简称本系统）是一套面向 Pi Network 生态的**白标商户应用模板框架**。本系统采用 Monorepo 架构（pnpm + Turborepo），以 Next.js 14 App Router + TypeScript 为核心技术栈，内置企业级 AI 服务路由引擎，支持 OpenAI / Anthropic / Ollama 多模型动态切换与自动容错。

系统设计理念为"80% 通用底座 + 20% 行业配置"，通过行业预设与商户配置机制，可在极短周期内交付定制化商户应用，覆盖美容/美甲、健身、培训、咨询等多种垂直行业。

## 1.2 核心特性

- **多 AI 提供商智能路由**：基于 Strategy + Factory 设计模式，支持 OpenAI、Anthropic (Claude)、Ollama 三大 AI 服务提供商的动态选择与自动容错降级
- **Pi Network 原生支付**：完整集成 Pi U2A（User-to-App）支付流程，包括创建支付、审批、链上确认、完成的完整生命周期管理
- **多租户架构**：V2.0.0 新增商户级数据硬隔离，支持单一框架实例服务海量商户
- **License 授权验证**：基于 HMAC-SHA256 的离线授权验证，支持多层级商业授权控制
- **用量统计与配额管理**：微秒级 API 调用与 Token 消耗追踪，支持月度订阅制计费模型
- **Monorepo 工程化**：基于 pnpm Workspace + Turborepo 的高性能构建体系，共享包在 apps 之间零冗余复用
- **安全认证体系**：Pi SDK 认证 + HMAC 签名 Session + HttpOnly Cookie 的多层安全防护
- **行业配置化**：通过结构化配置驱动 UI 渲染、功能模块开关与业务流程定制

## 1.3 技术栈

| 层级     | 技术选型                | 说明                                 |
| -------- | ----------------------- | ------------------------------------ |
| 前端框架 | Next.js 14 (App Router) | React Server Components + 流式渲染   |
| 编程语言 | TypeScript 5.4+         | 严格模式，全项目类型安全             |
| UI 样式  | Tailwind CSS 3          | 原子化 CSS，按需编译                 |
| 后端     | Next.js API Routes      | 同构服务端，无需独立后端             |
| 数据库   | PostgreSQL 15+          | 关系型数据库，Prisma ORM 映射        |
| ORM      | Prisma 5                | 类型安全的数据库访问层               |
| 包管理   | pnpm 8 (Monorepo)       | 高效依赖解析与磁盘利用               |
| 构建工具 | Turborepo 2             | 增量构建，任务缓存                   |
| AI 引擎  | 多提供商路由器          | OpenAI / Anthropic / Ollama 智能切换 |
| 支付     | Pi Network U2A          | 链上支付，Pi Platform API 集成       |
| 部署     | Vercel / Docker         | Serverless 或容器化部署              |

---

# 2 安装与部署

## 2.1 环境准备

| 项目       | 最低要求                                |
| ---------- | --------------------------------------- |
| 操作系统   | Windows 10+ / macOS 12+ / Ubuntu 20.04+ |
| Node.js    | >= 18.0.0                               |
| pnpm       | >= 8.0.0                                |
| PostgreSQL | >= 15.0                                 |
| 内存       | >= 4 GB                                 |
| 磁盘       | >= 2 GB 可用空间                        |

## 2.2 安装步骤

```bash
# 1. 安装 Node.js 18+
# 2. 安装 pnpm
npm install -g pnpm

# 3. 克隆项目
git clone <repository-url>
cd PiMerchantFramework

# 4. 安装依赖
pnpm install

# 5. 配置环境变量
cp .env.example .env
# 编辑 .env，填写数据库连接、API Key 等

# 6. 初始化数据库
pnpm db:migrate
pnpm db:seed

# 7. 启动开发服务器（同时启动前台 3000 和后台 3001）
pnpm dev
```

## 2.3 环境变量配置

| 变量名                    | 必填   | 说明                                                 |
| ------------------------- | ------ | ---------------------------------------------------- |
| `DATABASE_URL`            | 是     | PostgreSQL 连接字符串                                |
| `PI_API_KEY`              | 是     | Pi Developer Portal API Key                          |
| `PI_PLATFORM_API_BASE`    | 否     | Pi Platform API 地址，默认为 https://api.minepi.com  |
| `NEXT_PUBLIC_MERCHANT_ID` | 是     | 默认商户 ID                                          |
| `NEXTAUTH_SECRET`         | 是     | Session 签名密钥（>=32 字符）                        |
| `AI_PRIMARY_PROVIDER`     | 否     | 主 AI 提供商（openai/anthropic/ollama），默认 openai |
| `AI_FALLBACK_PROVIDERS`   | 否     | 容错降级顺序（逗号分隔），默认 anthropic,ollama      |
| `OPENAI_API_KEY`          | 条件\* | OpenAI API 密钥（使用 OpenAI 时必填）                |
| `ANTHROPIC_API_KEY`       | 条件\* | Anthropic API 密钥（使用 Anthropic 时必填）          |
| `OLLAMA_API_BASE`         | 否     | Ollama 服务地址，默认 http://localhost:11434         |
| `OLLAMA_ENABLED`          | 否     | 是否启用 Ollama（true/false），默认 true             |
| `LICENSE_PAYLOAD`         | 条件\* | 商业版 License（base64 编码的 JSON），生产环境必填   |
| `USAGE_WEBHOOK_URL`       | 否     | 用量审计 Webhook 地址                                |
| `MONITORING_WEBHOOK_URL`  | 否     | 监控日志 Webhook 地址                                |

---

# 3 技术架构

## 3.1 Monorepo 工程结构

```
PiMerchantFramework/
├── apps/
│   ├── web/                  # 商户前台（客户使用，Pi Browser 中运行）
│   │   └── src/
│   │       ├── app/          # Next.js App Router 路由
│   │       │   ├── api/      # API Routes
│   │       │   ├── (auth)/   # 登录页面
│   │       │   ├── ai/       # AI 聊天页面
│   │       │   ├── checkout/ # 支付收银台
│   │       │   ├── dashboard/# 客户仪表盘
│   │       │   ├── services/ # 服务目录
│   │       │   └── ...       # 其他页面（docs/privacy/terms）
│   │       ├── components/   # 前台 UI 组件
│   │       ├── hooks/        # React Hooks
│   │       └── lib/          # 工具库（session/prisma/swagger）
│   ├── admin/                # 商户后台（管理员使用）
│       └── src/
│           ├── app/          # 后台路由
│           │   ├── api/admin/# 后台 API
│           │   ├── dashboard/# 统计面板
│           │   ├── orders/   # 订单管理
│           │   ├── payments/ # 支付记录
│           │   ├── services/ # 服务管理
│           │   ├── bookings/ # 预约管理
│           │   ├── memberships/ # 会员方案
│           │   ├── monitoring/  # 运行监控
│           │   └── settings/ # 店铺设置
│           └── lib/          # 工具库
├── packages/
│   ├── pi-sdk/               # 核心 SDK（支付 + 认证 + AI + 商业模块）
│   │   └── src/
│   │       ├── ai-providers/ # AI 多提供商路由系统
│   │       ├── license/      # License 授权验证
│   │       ├── tenant/       # 多租户管理
│   │       ├── usage/        # 用量追踪
│   │       ├── types/        # SDK 类型定义
│   │       ├── ai-service.ts # AI 服务入口
│   │       ├── auth-service.ts # 认证服务
│   │       ├── payment-service.ts # 支付服务
│   │       ├── logger.ts     # 结构化日志
│   │       ├── env-validator.ts # 环境校验
│   │       └── index.ts      # SDK 导出入口
│   ├── config/               # 商户配置类型 + 行业预设
│   ├── types/                # 通用业务类型
│   └── ui/                   # 通用 UI 组件
├── prisma/                   # 数据库 Schema + 迁移 + Seed
├── docs/                     # 技术文档
└── scripts/                  # 工具脚本
```

### 包间依赖关系

| 包                | 职责                                                    | 被依赖方             |
| ----------------- | ------------------------------------------------------- | -------------------- |
| `packages/types`  | 业务类型定义                                            | 所有包               |
| `packages/pi-sdk` | 核心 SDK（支付 + 认证 + AI + License + Tenant + Usage） | apps/web, apps/admin |
| `packages/config` | 商户配置 + 行业预设                                     | apps/web             |
| `packages/ui`     | 通用 UI 组件                                            | apps/web, apps/admin |

## 3.2 数据库设计

本系统采用 PostgreSQL 关系型数据库，通过 Prisma ORM 进行类型安全的数据访问。核心数据模型：

| 表名          | 职责                   | 关联关系                |
| ------------- | ---------------------- | ----------------------- |
| `merchants`   | 商户基本信息           | 一对多关联所有业务表    |
| `customers`   | 顾客档案（按商户隔离） | 归属于 merchant         |
| `services`    | 服务目录               | 归属于 merchant         |
| `orders`      | 订单记录               | 关联 customer + service |
| `payments`    | Pi 支付记录            | 一对一关联 order        |
| `memberships` | 会员方案               | 归属于 merchant         |
| `bookings`    | 预约记录               | 关联 customer + service |

所有业务表均包含 `merchant_id` 外键，架构层面已支持多租户扩展。

## 3.3 认证体系

```
客户方(Pi Browser)            服务端                   Pi Platform API
    |                          |                          |
    | Pi.authenticate()        |                          |
    |------------------------->|                          |
    |                          |GET /v2/me                |
    |                          |Bearer accessToken        |
    |                          |------------------------->|
    |                          |<--- { uid, username } ---|
    |                          |                          |
    |                          |upsert customers          |
    |                          |sign HMAC session         |
    |<-- Set-Cookie: pi_auth_token (HttpOnly, Secure) ----|
```

**安全机制：**

- Pi SDK 端认证 -> Pi Platform API 二次验证 -> HMAC 签名 Session
- Session 存储在 HttpOnly + Secure Cookie（防 XSS / CSRF）
- JWT 载荷包含：`{ sub, piUid, username, merchantId }`
- Session 有效期：7 天

---

# 4 核心功能模块

## 4.1 中间件安全体系

本系统在 Next.js 中间件层实现了统一的请求拦截与安全防护。

### Web 前端中间件（`apps/web/src/middleware.ts`）

- 检查 `pi_auth_token` Cookie 判断登录状态
- 保护 `/dashboard`、`/account`、`/billing` 等路由
- 未认证请求重定向到 `/login`
- 租户 ID 解析（三级 Fallback）：
  1. `x-tenant-id` 请求头
  2. `merchant_id` Cookie
  3. `NEXT_PUBLIC_MERCHANT_ID` 环境变量

### Admin 后台中间件（`apps/admin/src/middleware.ts`）

- 独立的认证检查策略
- 保护全部后台路由

**安全策略：**

| 路由模式          | 认证要求       | 说明     |
| ----------------- | -------------- | -------- |
| `/` (首页)        | 无             | 公开访问 |
| `/api/auth/*`     | 无             | 认证端点 |
| `/api/payments/*` | Cookie Session | 支付操作 |
| `/api/ai/*`       | Cookie Session | AI 查询  |
| `/admin/*`        | 管理员 Session | 后台管理 |

## 4.2 API 路由结构

```
apps/web/src/app/api/
├── auth/
│   ├── pi/route.ts          # POST - Pi 认证入口
│   ├── me/route.ts          # GET - 获取当前用户
│   └── logout/route.ts      # POST - 登出
├── payments/
│   ├── approve/route.ts     # POST - 支付审批
│   ├── complete/route.ts    # POST - 支付完成
│   └── cancel/route.ts      # POST - 支付取消
├── ai/
│   ├── query/route.ts       # POST - AI 智能查询（非流式）
│   └── stream/route.ts      # POST - AI 流式查询（SSE）
├── orders/route.ts          # GET/POST - 订单管理
├── docs/route.ts            # GET - Swagger API 文档
└── license/validate/route.ts # POST - License 验证

apps/admin/src/app/api/admin/
├── dashboard/stats/route.ts # GET - 仪表盘统计
├── orders/route.ts          # GET - 订单列表
├── payments/route.ts        # GET - 支付记录
└── memberships/route.ts     # GET - 会员方案
```

### 统一响应格式

```typescript
// 成功响应
{ success: true, data: T }

// 错误响应
{ success: false, error: string }
```

## 4.3 智能 AI 路由系统 (V1.1.0)

本系统在企业级多 AI 提供商路由引擎，支持 OpenAI、Anthropic (Claude)、Ollama 三大主流 AI 服务提供商的智能选择与自动容错。

### 4.3.1 Strategy 模式设计

系统采用 **Strategy（策略）设计模式** 定义统一的 AI 提供商接口 `AIProvider`，所有提供商均实现该接口，保证调用方无需感知具体实现差异。

```
                    ┌─────────────────────┐
                    │  AIProvider 接口      │
                    │ ─────────────────── │
                    │ + name: string       │
                    │ + chat(request)      │
                    │ + isAvailable()      │
                    │ + healthCheck()      │
                    └────────┬────────────┘
                             │ implements
                ┌────────────┼────────────┐
                ▼            ▼            ▼
        ┌────────────┐ ┌──────────┐ ┌───────────┐
        │ OpenAI     │ │Anthropic │ │ Ollama    │
        │ Provider   │ │ Provider │ │ Provider  │
        │ (GPT-4o)   │ │ (Claude) │ │ (Llama3)  │
        └────────────┘ └──────────┘ └───────────┘
```

**抽象基类 (Template Method 模式)：**

系统同时引入 `BaseAIProvider` 抽象基类，采用 Template Method 模式将通用逻辑（超时控制、HTTP 错误处理、结构化日志）固化在基类中，子类仅需实现差异化的 `executeChat()` 方法。

| 基类封装的通用逻辑         | 子类实现的差异化逻辑   |
| -------------------------- | ---------------------- |
| 超时控制 (AbortController) | API 端点地址与请求格式 |
| HTTP 错误统一包装          | 认证头构建方式         |
| 结构化日志记录             | 响应解析与格式转换     |
| AbortError -> 可读消息     | 可用性检查策略         |

**各提供商差异处理：**

| 提供商    | 认证方式       | System Prompt 处理 | 响应提取路径                 | 默认模型        |
| --------- | -------------- | ------------------ | ---------------------------- | --------------- |
| OpenAI    | `Bearer` Token | messages 数组内    | `choices[0].message.content` | gpt-4o-mini     |
| Anthropic | `x-api-key` 头 | 顶层 `system` 参数 | `content[0].text`            | claude-sonnet-4 |
| Ollama    | 无需认证       | messages 数组内    | `message.content`            | llama3.1        |

### 4.3.2 Factory 路由与自动容错 (Failsafe)

系统采用 **Factory（工厂）设计模式** 实现提供商的动态选择与自动容错降级。

**核心容错机制：**

1. **可用性预检查**：调用前通过 `isAvailable()` 检查 API Key / 服务配置，跳过不可用节点
2. **自动降级**：主提供商 API 调用失败时，自动按配置顺序尝试备选提供商
3. **错误聚合**：所有提供商失败时，返回包含完整失败链路的聚合错误信息
4. **路由追踪**：每次路由决策均生成 `RoutingDecision` 日志，包含请求路径、实际提供商、跳过原因及耗时

### 4.3.3 流式响应支持

系统支持 AI 响应的 Server-Sent Events (SSE) 流式输出：

- 端点：`POST /api/ai/stream`
- 心跳机制：每 15 秒发送 `: ping` 防止连接超时
- 数据格式：`data: {"content":"..."}` 和 `data: [DONE]`
- 错误格式：`event: error` 事件
- 客户端实现：`apps/web/src/hooks/useChatStream.ts`

### 4.3.4 健康检查机制

每个提供商均实现 `healthCheck()` 方法，用于在运行时验证远程服务的可达性：

| 提供商    | 健康检查端点        | 超时时间 | 检查方式                  |
| --------- | ------------------- | -------- | ------------------------- |
| OpenAI    | `GET /v1/models`    | 5 秒     | 验证 API Key + 服务可达   |
| Anthropic | `POST /v1/messages` | 5 秒     | 最小化请求验证 Key 有效性 |
| Ollama    | `GET /api/tags`     | 3 秒     | 验证本地服务在线          |

### 4.3.5 向后兼容性

核心入口方法 `generateMerchantAiResponse()` 保持与 V1.0.0 完全兼容的方法签名。新增参数均为可选字段，不影响任何现有调用方。

```typescript
// V1.0.0 调用方式（完全兼容，无需修改）
const result = await generateMerchantAiResponse({
  merchantId: 'merchant-001',
  prompt: '帮我优化库存管理流程',
});

// V1.1.0 新增：指定提供商
const result = await generateMerchantAiResponse({
  merchantId: 'merchant-001',
  prompt: '帮我优化库存管理流程',
  provider: 'anthropic', // 可选：指定使用 Anthropic
});
```

## 4.4 Pi Network 支付集成

系统完整封装了 Pi Network U2A（User-to-App）支付流程：

```
前端                    后端                    Pi Platform API
 |                       |                          |
 | Pi.createPayment()    |                          |
 |---------------------->|                          |
 |                       |                          |
 |onReadyForServerApproval(paymentId)                |
 |---------------------->|                          |
 |                       |POST /api/payments/approve |
 |                       |------------------------->|
 |                       |                          |
 | (用户在 Pi 钱包确认)    |                          |
 |                       |                          |
 |onReadyForServerCompletion(paymentId, txid)        |
 |---------------------->|                          |
 |                       |POST /api/payments/complete|
 |                       |------------------------->|
 |                       |                          |
 |-> 跳转支付结果页       |更新订单状态 COMPLETED     |
```

**实现文件：**

- `packages/pi-sdk/src/payment-service.ts`：支付服务封装
  - `createPayment()`: 触发 Pi U2A 支付
  - `approvePayment()`: 服务端审批支付
  - `completePayment()`: 服务端完成支付
  - `handlePendingPayments()`: 未完成支付自动恢复
- `apps/web/src/app/api/payments/`：支付 API 路由
  - `approve/route.ts`：支付审批端点
  - `complete/route.ts`：支付完成端点
  - `cancel/route.ts`：支付取消端点
- `apps/web/src/app/checkout/`：支付收银台页面

**支付安全保障：**

- 所有支付审批/完成操作均在服务端执行，前端禁止直接调用 Pi Platform API
- 支付回调幂等处理，防止重复提交
- 未完成支付自动恢复机制（在用户重新认证时触发）
- 使用 HttpOnly Session 验证用户身份

## 4.5 商户配置化引擎

系统通过结构化配置对象驱动 UI 渲染与业务流程：

```typescript
MerchantConfig
├── modules.booking      -> 预约模块开关
├── modules.membership   -> 会员模块开关
├── homepage.layout      -> 首页布局顺序
├── industry.skin        -> 行业主题皮肤
└── payment.checkoutMode -> 结账模式
```

**支持的行业预设：**

| 行业      | 皮肤标识     | 核心功能          |
| --------- | ------------ | ----------------- |
| 美容/美甲 | `beauty`     | 预约 + 次卡       |
| 健身      | `fitness`    | 月卡 + 课程预约   |
| 培训/课程 | `education`  | 课时包 + 在线预约 |
| 咨询/维修 | `consulting` | 时间预约          |
| 通用      | `generic`    | 服务列表 + 下单   |

## 4.6 法律与合规声明 (V2.0.0)

### 4.6.1 隐私保护架构

- **最小化数据收集**：平台仅收集商户必要的标识（merchantId）与用于会话验证的 HMAC 签名会话令牌（Cookie 名称：`pi_auth_token`）。平台不会存储用户私钥或支付密码，也不以明文形式在第三方云存储会话凭证。
- **本地优先策略**：客户端会话通过 HttpOnly Cookie 保持，本系统在默认实现中不会将敏感凭证以明文形式上传到外部存储；可选的监控/审计数据通过脱敏或聚合方式上报。
- **多租户硬隔离**：请求作用域使用 `AsyncLocalStorage` 注入租户上下文（`merchantId`），并在 Prisma 层通过中间件自动注入 `merchantId` 过滤，形成运行时 + 数据库层面的双重隔离，防止跨租户数据访问。

### 4.6.2 免责声明机制

- **AI 生成内容免责声明**：平台提供的 AI 建议与输出仅供参考，用户在依据 AI 给出的建议进行决策前应自行验证其适用性与准确性。平台在法律允许范围内对因依赖 AI 内容导致的任何损失不承担额外责任。
- **链上交易免责**：平台集成 Pi Platform 进行链上支付，但链上交易存在网络确认延迟及第三方节点不可控性。对于因网络拥堵、节点故障或第三方 API 中断引发的交易延迟或丢失，平台不承担超出服务级别约定的法律责任。
- **第三方服务可用性声明**：本系统可能依赖 OpenAI、Anthropic、Ollama 等第三方服务。任何第三方服务的中断、性能下降或策略变更均可能影响本平台功能，平台对第三方服务引发的损失仅在法律允许范围内承担责任。

### 4.6.3 合规与用户权利

- **GDPR 风险对齐**：系统设计遵循最小权限与最小暴露原则，支持对用户数据的访问、更正与删除请求；建议部署方在面向欧盟用户时补充数据处理协议与数据保护影响评估（DPIA）。
- **审计与可追溯性**：日志与用量记录以结构化方式输出，敏感字段在上报时应予以脱敏；推荐配置 `MONITORING_WEBHOOK_URL` 将审计日志推送至专用审计系统。

---

# 5 商业核心能力 (V2.0.0 新增)

## 5.1 License 授权验证系统

采用去中心化的加密 License 验证机制，支持多层商业授权控制。实现位于 `packages/pi-sdk/src/license/`。

### 5.1.1 核心模块

| 文件           | 职责                                                |
| -------------- | --------------------------------------------------- |
| `types.ts`     | SerializedLicense, License, LicenseFeature 类型定义 |
| `validator.ts` | 过期检查 + HMAC-SHA256 签名验证 + Feature Gate      |
| `manager.ts`   | 环境加载 + 内存缓存 + 便利 API                      |

### 5.1.2 验证流程

1. **加载阶段**：读取 `LICENSE_PAYLOAD` 环境变量（base64 编码 JSON），不存在时根据 `NODE_ENV` 判断
   - `development`/`test` 模式：自动颁发企业级开发许可（功能全开，有效期 365 天）
   - `production` 模式：拒绝访问，提示配置 LICENSE_PAYLOAD
2. **缓存阶段**：使用 License ID 作为缓存键，TTL 为 5 分钟
3. **三步验证**：
   - 过期检查：`expiresAt` vs `Date.now()`
   - 签名验证：HMAC-SHA256，使用 Web Crypto API
   - Feature Gate：检查所需功能是否已授权

### 5.1.3 套餐等级与功能映射

| 等级         | 功能                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------- |
| Starter      | ai_routing                                                                                  |
| Professional | ai_routing, streaming, usage_tracking, webhook_monitoring                                   |
| Enterprise   | ai_routing, streaming, multi_tenant, usage_tracking, webhook_monitoring, advanced_analytics |

## 5.2 多租户架构

实现商户级数据与配置硬隔离，支持单一框架实例服务海量商户（Tenant）。实现位于 `packages/pi-sdk/src/tenant/`。

### 5.2.1 核心模块

| 文件                   | 职责                                            |
| ---------------------- | ----------------------------------------------- |
| `types.ts`             | Tenant, CreateTenantParams, TenantConfig 等类型 |
| `manager.ts`           | 租户 CRUD + 配置隔离 + 内存缓存                 |
| `context.ts`           | AsyncLocalStorage 运行时上下文注入              |
| `prisma-middleware.ts` | Prisma 中间件自动注入 merchantId 过滤           |

### 5.2.2 生命周期状态

- **Active**（激活）：正常服务状态
- **Suspended**（挂起）：暂停服务，可恢复
- **Cancelled**（注销）：软删除，不可恢复

### 5.2.3 数据隔离机制

1. **运行时隔离**：通过 `AsyncLocalStorage` 在每个请求上下文中注入当前租户的 `merchantId`
2. **查询隔离**：`tenantContext.getTenantId()` 读取当前上下文，Prisma 中间件自动在 `findMany`/`findFirst`/`findUnique` 等操作中注入 `merchantId` 条件
3. **硬隔离验证**：所有业务表（Customer/Order/Payment/Booking/Membership/Service）均受白名单保护，未在隔离范围内的访问将被拒绝

## 5.3 用量统计与配额管理

提供微秒级的 API 调用与 Token 消耗追踪，支持月度订阅制计费模型。实现位于 `packages/pi-sdk/src/usage/`。

### 5.3.1 核心模块

| 文件         | 职责                                            |
| ------------ | ----------------------------------------------- |
| `types.ts`   | UsageRecord, QuotaStatus, UsageSummary 等类型   |
| `tracker.ts` | 内存缓冲 + 月度计数器 + 配额断言 + 周期性 Flush |

### 5.3.2 核心机制

- **内存缓冲架构**：用量日志实时写入内存缓冲区与月度原子计数器，零 IO 阻塞
- **硬性配额断言**：在关键路由网关层执行 `assertQuotaNotExceeded` 检查（`maxRequestsPerMonth=0` 视为无限配额）
- **异步 Flush 机制**：通过定时任务批量推送至 `USAGE_WEBHOOK_URL` 审计系统；在网络异常或无配置环境下，自动降级为可观测性控制台日志
- **配额预警**：使用率达到 80% 时触发警告日志

---

# 6 API 接口参考

## 6.1 认证接口

### POST /api/auth/pi

Pi 用户登录认证。

**请求体：**

```json
{
  "accessToken": "pi_sdk_access_token",
  "piUid": "pi_user_uid",
  "username": "pi_username",
  "merchantId": "merchant_id"
}
```

**处理流程：**

1. 使用 accessToken 调用 Pi Platform API `/v2/me` 验证身份
2. 验证返回的 UID 与前端提交的 UID 是否匹配（防伪造）
3. Upsert Customer 记录到数据库
4. 生成 HMAC 签名的 Session Token 写入 HttpOnly Cookie
5. 返回用户信息和 Token

### POST /api/auth/logout

清除认证 Cookie。

### GET /api/auth/me

获取当前登录用户信息，依赖 `pi_auth_token` Cookie。

## 6.2 支付接口

### POST /api/payments/approve

审批 Pi 支付（`onReadyForServerApproval` 回调）。

**请求体：**

```json
{
  "paymentId": "pi_payment_id",
  "orderId": "local_order_id"
}
```

### POST /api/payments/complete

完成 Pi 支付（`onReadyForServerCompletion` 回调）。

**请求体：**

```json
{
  "paymentId": "pi_payment_id",
  "txid": "on_chain_transaction_id"
}
```

### POST /api/payments/cancel

取消 Pi 支付。

## 6.3 AI 接口

### POST /api/ai/query

非流式 AI 查询。

**请求体：**

```json
{
  "prompt": "查询今日订单统计",
  "provider": "anthropic"
}
```

### POST /api/ai/stream

流式 AI 查询（Server-Sent Events）。

**响应格式：**

```
data: {"content":"回答片段"}

data: [DONE]
```

错误时：

```
event: error
data: {"message":"错误信息"}
```

## 6.4 License 接口

### POST /api/license/validate

验证 License 有效性。

**请求体：**

```json
{
  "id": "license_id",
  "issuedTo": "merchant_name",
  "merchantId": "merchant_id",
  "issuedAt": "2026-01-01T00:00:00.000Z",
  "expiresAt": "2027-01-01T00:00:00.000Z",
  "tier": "enterprise",
  "features": ["ai_routing", "multi_tenant"],
  "signature": "hmac_signature"
}
```

## 6.5 订单接口

### GET /api/orders

获取订单列表（需认证）。

### POST /api/orders

创建新订单。

## 6.6 后台管理接口

### GET /api/admin/dashboard/stats

获取仪表盘统计数据。

### GET /api/admin/orders

获取订单管理列表。

### GET /api/admin/payments

获取支付记录列表。

### GET /api/admin/memberships

获取会员方案列表。

---

# 7 运维管理

## 7.1 日志与监控

系统内置结构化日志模块，所有日志以 JSON 格式输出：

```json
{
  "timestamp": "2026-05-15T01:30:00.000Z",
  "service": "pi-merchant-framework",
  "level": "info",
  "message": "AI request routed (primary)",
  "metadata": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "routingTimeMs": 3
  }
}
```

**日志级别：**

| 级别    | 使用场景                               |
| ------- | -------------------------------------- |
| `debug` | 开发调试信息                           |
| `info`  | 正常业务事件（请求、路由决策）         |
| `warn`  | 非致命异常（提供商降级、重试）         |
| `error` | 致命错误（所有提供商失败、数据库异常） |

支持通过 `MONITORING_WEBHOOK_URL` 环境变量将日志转发至外部监控平台。

## 7.2 数据库维护

```bash
# 生成 Prisma Client
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate

# 填充测试数据
pnpm db:seed

# 打开数据库管理界面
pnpm db:studio
```

## 7.3 常见运维操作

| 操作             | 步骤                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------- |
| 启动开发服务器   | `pnpm dev`                                                                             |
| 构建生产版本     | `pnpm build`                                                                           |
| 运行单元测试     | `pnpm test`                                                                            |
| 运行覆盖率测试   | `pnpm test:coverage`                                                                   |
| 类型检查         | `pnpm type-check`                                                                      |
| 切换主 AI 提供商 | 修改 `.env` 中 `AI_PRIMARY_PROVIDER` 为 `openai` / `anthropic` / `ollama`，重启服务    |
| 配置 AI 容错降级 | 修改 `.env` 中 `AI_FALLBACK_PROVIDERS` 为逗号分隔的提供商列表（如 `anthropic,ollama`） |
| 禁用本地 Ollama  | 设置 `.env` 中 `OLLAMA_ENABLED=false`，重启服务                                        |
| 查看 AI 路由决策 | 查看服务日志中 `message` 包含 `"AI request routed"` 的条目                             |
| 数据库迁移       | `pnpm db:migrate`                                                                      |
| 查看数据库       | `pnpm db:studio`                                                                       |

---

# 8 常见问题

**Q1: 启动时提示"无法找到模块 @pi-merchant/pi-sdk"？**

确保已运行 `pnpm install` 且当前目录为项目根目录。pnpm Workspace 会自动建立包之间的链接。

**Q2: 如何配置自定义域名？**

设置 `NEXT_PUBLIC_APP_URL` 环境变量为自定义域名地址。

**Q3: AI 路由 Fallback 如何工作？**

当主提供商（如 OpenAI）API 调用超时或返回错误时，系统自动按 `AI_FALLBACK_PROVIDERS` 顺序尝试备选提供商（如 Anthropic -> Ollama）。若所有提供商均失败，返回聚合并记录错误日志。

**Q4: 如何添加新的 AI 提供商？**

在 `packages/pi-sdk/src/ai-providers/` 下创建新提供商文件，实现 `BaseAIProvider` 抽象基类，并在 `factory.ts` 的构造函数中注册。

**Q5: 生产环境如何启用 License 验证？**

将 `LICENSE_PAYLOAD` 环境变量设置为 base64 编码的 License JSON。开发环境下系统自动颁发企业级开发许可，无需额外配置。

**Q6: 如何查看当前用量和配额？**

检查 `packages/pi-sdk/src/usage/tracker.ts` 中 `checkQuota()` 和 `summarizeUsage()` 方法的日志输出。可配置 `USAGE_WEBHOOK_URL` 将用量数据推送至外部审计系统。

**Q7: 支持哪些 Pi Platform API Base URL？**

默认为 `https://api.minepi.com`，可通过 `PI_PLATFORM_API_BASE` 环境变量自定义。

---

_本文档版权归 Pioneer AI 技术团队所有。未经许可，不得复制、传播或用于商业用途。_
