# Pi Merchant Framework 部署指南

> 版本: v2.1.0 · 更新日期: 2026-07-10

---

## 目录

1. [Vercel 部署（推荐快速上线）](#1-vercel-部署推荐快速上线)
2. [Docker 自托管部署](#2-docker-自托管部署)
3. [首次部署流程](#3-首次部署流程)
4. [升级流程](#4-升级流程)
5. [回滚方案](#5-回滚方案)
6. [密钥轮换流程](#6-密钥轮换流程)
7. [CI/CD 管道说明](#7-cicd-管道说明)

---

## 1. Vercel 部署（推荐快速上线）

### 前置条件

- Vercel 账号（个人或团队）
- Vercel CLI: `npm i -g vercel`
- 已配置 Vercel Postgres / Supabase / Neon 数据库

### 创建项目

| 项目     | 根目录       | 框架预设 |
| -------- | ------------ | -------- |
| 商户前台 | `apps/web`   | Next.js  |
| 管理后台 | `apps/admin` | Next.js  |

web 和 admin 需要分别创建两个 Vercel 项目。

### 配置环境变量

参考环境变量示例文件：

```bash
# web
apps/web/vercel.env.example.json

# admin
apps/admin/vercel.env.example.json
```

可使用交互式脚本推送环境变量：

```powershell
.scriptsconfigure-vercel-env.ps1
```

### 关键环境变量

| 变量                    | 说明                         |
| ----------------------- | ---------------------------- |
| `DATABASE_URL`          | PostgreSQL 连接字符串        |
| `NEXT_PUBLIC_APP_URL`   | Web 应用公开 URL             |
| `NEXT_PUBLIC_ADMIN_URL` | Admin 应用公开 URL           |
| `PI_API_KEY`            | Pi Network API Key           |
| `PI_SANDBOX`            | 沙箱模式（生产设为 `false`） |
| `LICENSE_PAYLOAD`       | License 载荷                 |

### 数据库迁移

```bash
pnpm db:migrate:deploy
```

### 验证

访问 `/api/health`，应返回 `{ "status": "ok", "database": "connected" }`。

---

## 2. Docker 自托管部署

### 架构

| 服务      | 镜像               | 端口  |
| --------- | ------------------ | ----- |
| app (web) | `Dockerfile`       | :3000 |
| admin     | `Dockerfile.admin` | :3001 |
| db        | postgres:15-alpine | 内网  |
| nginx     | nginx:alpine       | :80   |

### 首次部署

```bash
# 1. 创建 .env（基于 .env.example）
cp .env.example .env
# 编辑 .env 填充真实值

# 2. 构建并启动
docker compose -f docker-compose.prod.yml up -d

# 3. 验证健康检查
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
```

> 启动顺序: db → migrate（自动执行 `prisma migrate deploy`）→ app + admin

### 构建镜像（CI 场景）

```bash
# web
docker build -t pi-merchant-framework:latest -f Dockerfile .

# admin
docker build -t pi-merchant-framework:admin-latest -f Dockerfile.admin .
```

---

## 3. 首次部署流程

### Vercel 路径

1. 创建 web、admin 两个 Vercel 项目
2. 配置全部必需环境变量（参考 `vercel.env.example.json`）
3. 设置 `DATABASE_URL` 指向生产库
4. 执行 `pnpm db:migrate:deploy`
5. 配置 `NEXT_PUBLIC_APP_URL`、`NEXT_PUBLIC_ADMIN_URL`
6. 生产环墀课置 `PI_SANDBOX=false`
7. 验证 `/api/health` 返回 200

### Docker 路径

1. 创建 `.env`（基于 `.env.example`）
2. 确认 `pnpm-lock.yaml` 存在（保证可复现构建）
3. `docker compose -f docker-compose.prod.yml up -d`
4. 配置 Nginx TLS(Certbot/Cloudflare) 或前置 CDN
5. 启动监控栈
6. 验证 `/api/metrics` 可被 Prometheus 抓取
7. 配置 `MONITORING_WEBHOOK_URL` 告警

---

## 4. 升级流程

### Vercel

```bash
git push main
# CI 自动构建部署；手动可在 Vercel Dashboard 触发
```

### Docker

```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
# migrate 容器会自动执行 prisma migrate deploy
```

---

## 5. 回滚方案

### 镜像 Tag 回滚

```bash
# 查看可用版本
docker pull ${DOCKER_REPOSITORY}:${旧版本SHA}

# 回退
docker tag ${DOCKER_REPOSITORY}:${旧版本SHA} ${DOCKER_REPOSITORY}:latest
docker compose -f docker-compose.prod.yml up -d
```

### 数据库迁移回滚

```bash
# Prisma 迁移回滚（需手动指定迁移名称）
npx prisma migrate resolve --rolled-back "迁移名称"
# 注意: Prisma 不支持自动降级，需手动修复 schema 并创建新的回滚迁移
```

### Git Revert

```bash
git revert HEAD
git push origin main
```

---

## 6. 密钥轮换流程

1. 在 Vercel Dashboard / `.env`` 中添更水密钥
2. 重启应用（Vercel 自动 / Docker: `docker compose restart`）
3. 验证 `/api/health` 正常
4. 删除旧密钥（确认新密钥生效后）

---

## 7. CI/CD 管道说明

### GitHub Actions 工作流

```yaml
# .github/workflows/ci.yml
# 触发: push main/develop, PR main

# Jobs 依赖链:
# lint-typecheck → unit-tests → build
#                                   ├─ check-docker-secrets → docker-build-push 仅main)
#                                   └─ deploy-staging (仅develop)
#                                                       └─ deploy-production (仅main, 需docker-build-push完成)
```

### 所需 Secrets

| Secret                    | 用途                  |
| ------------------------- | --------------------- |
| `DOCKER_USERNAME`         | Docker Hub 用户名     |
| `DOCKER_PASSWORD`         | Docker Hub 密码/Token |
| `DOCKER_REPOSITORY`       | Docker 镜像仓库名     |
| `STAGING_DATABASE_URL`    | Staging 数据库连接    |
| `PRODUCTION_DATABASE_URL` | 生产数据库连接        |
| `VERCEL_TOKEN`            | Vercel 部署 Token     |
| `DEPLOY_HOST`             | 部署服务器 IP         |
| `DEPLOY_USER`             | SSH 用户              |
| `DEPLOY_SSH_KEY`          | SSH 私钥              |
| `DEPLOY_PATH`             | 部署目录路径          |

### 环境保护

- `deploy-production` job 使用 GitHub Environment `production`，需要审核批准（可选配置）
- Docker build 仅在 main 分支且配置了 Docker 凭据时触发

---

## 安全注意事项

- 所有 secret 通过环境变量注入，不入库
- 生产环境启用 `validateEnv()` 硬失败
- Pi API Key 仅服务端使用
- Grafana 默认密码 `admin/admin` 必须修改
- 移��� compose 中无用的 443 端口映射（直到配置 TLS）

---

## 8. 生产环境验收清单

每次部署后，按以下顺序执行验收：

### 8.1 健康检查

```bash
curl -I http://localhost:3000/api/health
# 期望: HTTP/1.1 200 OK

curl -I http://localhost:3001/api/health
# 期望: HTTP/1.1 200 OK
```

### 8.2 Worker 状态

```bash
docker compose logs worker | grep "Worker started"
# 期望: 日志中出现 "Image generation worker initialized"
```

### 8.3 Nginx 超时 & 大文件上传

```bash
# 测试 client_max_body_size (20M)
# 用 6MB 图片测试 API 上传
curl -X POST http://localhost/api/images/generate \
  -H "Content-Type: multipart/form-data" \
  -F "file=@./test-6mb-image.jpg" \
  -w "%{http_code}"
# 期望: 返回 200 (或非 413)
```

### 8.4 优雅关闭验证

```bash
# 启动容器后关闭它
docker compose stop worker --time 30

# 检查日志
docker compose logs worker | grep "closing worker"
# 期望: 10s 内打印 "Received SIGTERM, closing worker..."
# 期望: 随后的日志包含 "Worker closed, quitting Redis..."
```

### 8.5 容器健康状态

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
# 期望: 所有容器状态为 "(healthy)" 或 "(starting)"
```

### 8.6 启动脚本确认

```bash
docker compose exec app cat package.json | grep start:prod
# 期望: "start:prod": "node server.js"

docker compose exec admin cat package.json | grep start:prod
# 期望: "start:prod": "node server.js"
```
