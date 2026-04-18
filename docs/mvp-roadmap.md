# MVP 开发排期

> Pi Merchant Framework — P0 功能 4 周交付计划  
> 目标：完成 Pi 登录、服务展示、Pi 支付完整流程、后台基础管理

---

## 总览

| 周次 | 主题 | 主要交付物 |
|------|------|-----------|
| Week 1 | 环境搭建 + 数据库 + Pi 认证 | 开发环境就绪、数据库跑通、Pi 登录可用 |
| Week 2 | 服务目录 + 创建订单 | 服务列表/详情页、订单创建 API |
| Week 3 | Pi 支付完整流程 | Approve/Complete API、支付结果页 |
| Week 4 | 后台管理 + 联调收尾 | 后台订单/支付查看、端到端测试 |

---

## Week 1：环境搭建 + Pi 认证

**目标**：开发环境完整跑通，Pi 用户能成功登录并在数据库中创建记录。

### Day 1-2：环境搭建

- [ ] 安装 pnpm、Node.js 18+、PostgreSQL
- [ ] `pnpm install` 安装所有依赖
- [ ] 配置 `.env`（DATABASE_URL、PI_API_KEY、PI_SANDBOX=true）
- [ ] 运行 `pnpm db:migrate` 建表
- [ ] 验证 `prisma studio` 能打开并查看表结构

### Day 3-4：Pi 认证实现

- [ ] 完善 `apps/web/src/app/api/auth/pi/route.ts`
  - 接入 Pi Platform `/v2/me` 验证
  - `customers` 表 upsert 逻辑
  - JWT Cookie 签发
- [ ] 前台登录页 `(auth)/login/page.tsx` 联调
  - `Pi.authenticate()` 在 Pi Sandbox 测试
  - 登录成功跳转首页
- [ ] 实现 `/api/auth/me` GET 接口（读取当前用户）

### Day 5：测试 & 修复

- [ ] 在 Pi Sandbox 浏览器中跑通登录完整流程
- [ ] 验证 `customers` 表成功写入 `pi_uid` 和 `username`
- [ ] 处理 `onIncompletePaymentFound` 边界场景

**验收标准**：Pi Browser 中打开前台，点击登录，能看到"登录成功"状态，数据库有对应 customer 记录。

---

## Week 2：服务目录 + 创建订单

**目标**：商户能在后台创建服务，顾客能在前台看到并发起下单。

### Day 1-2：服务管理后台

- [ ] 后台服务列表页 `admin/services/page.tsx`
  - 实现 GET `/api/admin/services`（分页查询）
  - 实现 POST `/api/admin/services`（新增服务）
  - 实现 PUT `/api/admin/services/[id]`（编辑）
  - 实现 PATCH `/api/admin/services/[id]/status`（上下架）
- [ ] 后台新增服务表单（title、price、duration、type）

### Day 3-4：前台服务展示

- [ ] 实现 GET `/api/services`（前台服务列表）
- [ ] 服务列表页 `(shop)/services/page.tsx` 对接真实 API
- [ ] 服务详情页 `(shop)/services/[id]/page.tsx`
  - 展示服务完整信息
  - "立即预约"按钮跳转结账页（携带 serviceId）
- [ ] 首页热门服务对接真实数据

### Day 5：订单创建 API

- [ ] 实现 POST `/api/orders`
  - 验证用户已登录（读取 JWT Cookie）
  - 创建 `orders` 记录（status=PENDING_PAYMENT）
  - 生成唯一订单号（`ORD-YYYYMMDD-XXXXXX`）
  - 返回 `{ order: { id, orderNo } }`

**验收标准**：前台能看到服务列表，点击服务进入详情，点击"立即预约"能跳转结账页，控制台能看到 POST /api/orders 成功响应。

---

## Week 3：Pi 支付完整流程

**目标**：端到端打通 Pi U2A 支付，从点击支付到支付完成全流程走通。

### Day 1-2：支付 API 实现

- [ ] 完善 POST `/api/payments/approve`
  - Pi Platform `/v2/payments/{id}/approve` 调用
  - `payments` 表 upsert（idempotent）
  - `orders` 状态更新为 APPROVED
- [ ] 完善 POST `/api/payments/complete`
  - Pi Platform `/v2/payments/{id}/complete` 调用（传 txid）
  - `payments` 表更新 txid + 完成标志位
  - `orders` 状态更新为 COMPLETED

### Day 3：结账页联调

- [ ] 结账页 `(shop)/checkout/page.tsx` 完整联调
  - 加载服务详情（带 serviceId 参数）
  - 创建订单后触发 `Pi.createPayment()`
  - `onReadyForServerApproval` → 调用 approve API
  - `onReadyForServerCompletion` → 调用 complete API
  - 成功后跳转 `/payment-result`

### Day 4：支付结果 + 异常处理

- [ ] 支付结果页完善（成功/失败两种状态）
- [ ] 用户取消支付处理（POST /api/payments/cancel）
- [ ] `onIncompletePaymentFound` 断线重做测试
- [ ] Pi Sandbox 完整测试支付

### Day 5：集成测试

- [ ] 从登录 → 浏览服务 → 下单 → 支付 → 结果页完整跑一遍
- [ ] 数据库验证：orders/payments 表字段全部正确写入
- [ ] 测试支付取消场景
- [ ] 测试网络中断场景（断网后重连测试 incomplete payment）

**验收标准**：Pi Sandbox 中完整走通支付，数据库中 `payments.developer_completed = true` 且 `txid` 已写入。

---

## Week 4：后台管理 + 收尾联调

**目标**：后台各模块可用，整体可演示。

### Day 1-2：后台核心页面

- [ ] 后台 Dashboard API `GET /api/admin/dashboard/stats`
  - 今日订单数、今日收款、总会员数、待核销预约数
- [ ] 后台订单列表 `GET /api/admin/orders`（支持状态筛选）
- [ ] 后台支付记录 `GET /api/admin/payments`
- [ ] 后台管理员认证中间件（验证 merchant_user 身份）

### Day 3：预约 + 会员（基础版）

- [ ] 后台预约列表 `GET /api/admin/bookings`
- [ ] 预约核销 API `POST /api/admin/bookings/[id]/complete`
- [ ] 前台会员方案展示（静态数据，P1 再对接数据库）
- [ ] 后台设置页保存接口 `PUT /api/admin/settings`

### Day 4：产品测试 & Bug 修复

- [ ] 完整产品流程演示测试（QA）
- [ ] 修复发现的 Bug
- [ ] 错误处理优化（加 toast 提示等）
- [ ] 加载状态优化（skeleton loading）

### Day 5：文档 & 部署准备

- [ ] 补全 `prisma/seed.ts` 测试数据（1个商户、3个服务、1个会员方案）
- [ ] 验证 `pnpm db:seed` 能正确执行
- [ ] 整理本地部署文档
- [ ] （可选）配置 Vercel 部署验证

**验收标准**：完整 Demo 演示可用。后台能看到 Pi 支付记录的 pi_payment_id 和 txid。

---

## P1 功能（Week 5+）

| 功能 | 工作量 | 说明 |
|------|--------|------|
| 会员方案完整购买流程 | 3天 | 创建会员订单，支付后写 customer_memberships |
| 完整预约流程 | 2天 | 前台选时间槽 → 创建 booking → 后台核销 |
| 配置化首页布局 | 2天 | 按 MerchantConfig.homepage.layout 动态渲染 |
| 行业皮肤切换 | 2天 | CSS 变量 + Tailwind 主题 |

---

## 风险与注意事项

> [!WARNING]
> **Pi Sandbox 限制**：测试时必须使用 Pi Sandbox 模式（`PI_SANDBOX=true`），切勿在开发期间使用主网。

> [!IMPORTANT]
> **Pi Browser 依赖**：前台所有 Pi SDK 功能必须在 Pi Browser 中测试，普通浏览器无 `window.Pi` 对象。

> [!NOTE]
> **Approve 响应时间**：Pi SDK 对 `onReadyForServerApproval` 有超时限制，`/api/payments/approve` 接口必须在 30 秒内响应。建议数据库操作异步化，先响应 200，再异步更新。
