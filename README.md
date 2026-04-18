# Pi Merchant Framework

> **面向 Pi Network 生态的白标商户应用模板框架**  
> 设计理念：80% 通用底座 + 20% 行业配置，快速交付，降本增效

---

## 🎯 项目定位

这不是一个单一商户 App，而是一个**可复用、可配置、可快速交付的商户应用框架**。

目标是通过**行业预设 + 商户配置**，让每个商户在 1-2 天内获得自己的 Pi 应用，而非从零开发。

### 第一阶段支持的行业

| 行业 | 皮肤标识 | 核心功能 |
|------|---------|---------|
| 美容/美甲 | `beauty` | 预约 + 次卡 |
| 健身 | `fitness` | 月卡 + 课程预约 |
| 培训/课程 | `education` | 课时包 + 在线预约 |
| 咨询/维修 | `consulting` | 时间预约 |
| 通用 | `generic` | 服务列表 + 下单 |

---

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 14 (App Router) + React + TypeScript |
| UI 样式 | Tailwind CSS |
| 后端 | Next.js API Routes |
| 数据库 | PostgreSQL |
| ORM | Prisma |
| 包管理 | pnpm (Monorepo) |
| 构建工具 | Turborepo |
| 部署 | Vercel / Docker 兼容 |
| 支付 | Pi Network U2A Payment |

---

## 📁 目录结构

```
D:\PiMerchantFramework
├─ apps
│  ├─ web/          # 商户前台（客户端，Pi Browser 中运行）
│  └─ admin/        # 商户后台（管理员使用）
├─ packages
│  ├─ pi-sdk/       # Pi SDK 封装（支付 + 认证，最核心）
│  ├─ ui/           # 共用 UI 组件
│  ├─ config/       # 商户配置类型 + 行业预设
│  └─ types/        # 共用业务类型
├─ prisma/          # 数据库 Schema + 迁移 + Seed
├─ docs/            # 技术文档
└─ scripts/         # 工具脚本
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 确保已安装 pnpm
npm install -g pnpm

# 安装所有依赖
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填写 DATABASE_URL 和 PI_API_KEY
```

### 3. 初始化数据库

```bash
# 执行迁移
pnpm db:migrate

# 插入测试数据
pnpm db:seed
```

### 4. 启动开发服务器

```bash
# 同时启动前台 (3000) 和后台 (3001)
pnpm dev
```

---

## 💳 Pi 支付流程

```
前端                    后端                    Pi Platform API
 │                       │                           │
 │ Pi.createPayment()    │                           │
 │──────────────────     │                           │
 │                       │                           │
 │ onReadyForServerApproval(paymentId)               │
 │──────► POST /api/payments/approve ──► POST /v2/payments/{id}/approve
 │                       │                           │
 │ (用户在 Pi 钱包确认)   │                           │
 │                       │                           │
 │ onReadyForServerCompletion(paymentId, txid)        │
 │──────► POST /api/payments/complete ─► POST /v2/payments/{id}/complete
 │                       │                           │
 │ ← 跳转支付结果页       │ 更新订单状态=COMPLETED    │
```

详细流程见 [`docs/payment-flow.md`](./docs/payment-flow.md)

---

## ⚙️ 商户配置

通过修改 `packages/config/src/merchant-config.ts` 接口配置商户。

使用行业预设快速初始化：

```typescript
import { getIndustryPreset } from '@pi-merchant/config';

const config = {
  merchantId: 'your-merchant-id',
  info: { name: '美丽时光美甲店', type: 'beauty' },
  ...getIndustryPreset('beauty'),  // 一行应用行业预设
};
```

---

## 📋 开发优先级

| 优先级 | 功能 | 状态 |
|--------|------|------|
| P0 | Pi 用户登录 | 骨架✅ |
| P0 | 服务列表展示 | 骨架✅ |
| P0 | 创建订单 + Pi 支付 | 骨架✅ |
| P0 | 后台查看订单/支付 | 骨架✅ |
| P1 | 会员方案购买 | 骨架✅ |
| P1 | 预约管理 | 骨架✅ |
| P2 | A2U 退款 | 待开发 |
| P2 | 优惠券 | 待开发 |

---

## 📚 文档索引

- [支付流程文档](./docs/payment-flow.md)
- [系统架构文档](./docs/architecture.md)  
- [MVP 开发排期](./docs/mvp-roadmap.md)
- [商户配置指南](./docs/merchant-config-guide.md)
- [数据库设计](./docs/database-design.md)

---

## 🔐 安全注意事项

- **绝不在客户端暴露 `PI_API_KEY`**（仅在 Server-side 使用）
- 所有支付审批必须走后端，禁止前端直接调用 Pi Platform API
- 数据库操作统一走 Prisma，禁止裸 SQL
- JWT Session 使用 HttpOnly Cookie 存储

---

## 📄 License

MIT
