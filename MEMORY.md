# MEMORY.md — Pi Merchant Framework

> 项目长期记忆与架构决策。更新于最近一次交付。

## 项目概述

**Pi Merchant Framework** — 基于 Pi Network 生态的商户应用框架（白标中间件）。
技术栈：Next.js 14 (App Router) · TypeScript Strict · Prisma · BullMQ · Turborepo · PostgreSQL · Tailwind CSS · pnpm。

## 目录结构

```
D:\PiMerchantFramework
├── apps/
│   ├── web/       # 主站（客户侧）：首页 + (app) 路由组 + 收银台/支付
│   └── admin/     # 后台管理：(auth)/(dashboard) 路由组
├── packages/
│   ├── pi-sdk/    # Pi Network SDK（认证/支付/多租户/许可证）
│   ├── types/     # 共享类型
│   ├── config/    # 商户配置
│   └── ui/        # 共享 UI 组件
├── prisma/        # 数据库 schema + seed + migrations
├── src/           # 遗留 lib 代码（jest 仍引用，保留）
├── docs/ scripts/ deploy/ tests/ python-service/
└── MEMORY.md
```

## 设计系统（大厂级深色主题）

- **色板**（`apps/web/tailwind.config.ts` + `globals.css`）：底 `#07030E`、Pi 金 `#F3C136`、紫 `#8B5CF6`。
- **组件类**：`.pi-card` `.pi-btn-gold` `.pi-btn-ghost` `.pi-pill` 等。
- **AppShell**：`apps/web/src/components/layout/AppShell.tsx`（侧边导航 + 顶栏 Pi 连接状态 + 用户菜单）。
- 主站 `(app)` 路由组统一走 AppShell；admin 用 `DashboardShell.tsx` 客户端壳 + 服务端布局。

## 关键架构决策

1. **Pi 类型统一**：`window.Pi` 用 `PiSDK`（`packages/pi-sdk/src/types/pi.d.ts`）统一声明。
   导入路径必须用 `@pi-merchant/pi-sdk/src/types/pi`（`moduleResolution: node` 忽略 exports）。
2. **useRequest Hook 不从 SDK 主入口导出**（服务端 SDK 不能含 React Hook，否则 Next 构建失败）。
3. **支付流程（支付优先）**：收银台 `checkout/page.tsx` 握手成功后【立即】`Pi.createPayment`，
   订单号客户端生成 `ORD-<ts>-<rand>`，`/api/orders` 接受 `orderNo` 保持前后端一致，审批传 `orderId`。
4. **订阅档位 π50/π90**（以 UI 为准）：首页 `page.tsx`、收银台 `PLANS`、`CheckoutClient` 三处一致。
5. **图像队列惰性初始化**：`image.queue.ts` 不在 import 期连 Redis（避免构建期 ECONNREFUSED），
   无 Redis 时接口优雅返回 503。
6. **服务端布局 + 客户端壳**：admin `(dashboard)/layout.tsx` 是服务端布局渲染 `DashboardShell`，
   避免客户端布局在 Linux 触发 `page_client-reference-manifest.js` ENOENT。
7. **路由组不覆盖根 page**：`(dashboard)/dashboard/page.tsx` 才是 `/dashboard`，
   `(dashboard)/page.tsx` 会与根 `app/page.tsx` 冲突（也触发上述 ENOENT）。

## 环境变量（关键）

| 变量                     | 用途                                     | 状态                                |
| ------------------------ | ---------------------------------------- | ----------------------------------- |
| `PI_API_KEY`             | Pi Server API Key（审批/完成服务端校验） | 本地 `.env.local` 已填，Vercel 已配 |
| `NEXT_PUBLIC_PI_SANDBOX` | Pi.init 沙盒开关                         | `true`=沙盒 / `false`=主网          |
| `PI_PLATFORM_API_BASE`   | Pi API 地址                              | 默认 `https://api.minepi.com`       |
| `DATABASE_URL`           | PostgreSQL 连接                          | 根 `.env`；Vercel 用 Neon           |
| `REDIS_URL`              | 图像队列 BullMQ                          | 本地/线上缺（图像生成需云 Redis）   |
| `LICENSE_PAYLOAD`        | 生产许可证                               | 可选                                |

## 部署与 Git

- **GitHub**：`github.com/chunmeiyunqi-stack/pi-merchant-framework`（分支 `main`）。
- **Vercel 项目**（团队 `chunmeiyunqi-stacks-projects`）：
  - `pi-merchant-framework-web`（主站，Root=apps/web）→ `pi-merchant-framework-web.vercel.app`
  - `pi-merchant-framework-admin`（后台，Root=apps/admin，Framework=Next.js）
  - 其余重复项目已删除。
- **构建**：Vercel 上 `vercel.json` 指定 `pnpm turbo run build --filter=@pi-merchant/<web|admin>`；
  本地 `pnpm build` 需在**非 CI** 环境（避免 standalone symlink EPERM）。
- **admin 的 vercel.json / next.config.js**：framework=nextjs；`output: standalone` 在 Vercel 禁用（`!VERCEL`）。

## 验证基线（全绿）

- `pnpm type-check` → 0 错误
- `pnpm build` → 6/6 任务成功（非 CI）
- `pnpm test` → 27 套件 / 402 通过 / 1 跳过

## 待办 / 注意事项

- 图像生成线上需配云 Redis（Upstash/Railway）+ `REDIS_URL`。
- GitHub Token 已在聊天暴露过，建议全部 Revoke 后换新。
- 遗留 `src/`（根目录）代码仍被 jest 引用，暂未清理；后续可评估并入 packages。
