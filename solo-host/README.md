# Pi Merchant Framework v2.1.0 — Pi Desktop SoloHost 安装包

> 面向 Pi Desktop 桌面操作系统的一键部署包
>
> 注意：SoloHost 不支持 `build:` 指令，所有服务使用远程 Docker 镜像。

## 目录结构

```
solo-host/
├── config_options.yml    # SoloHost 配置向导定义（生成 .env）
├── docker-compose.yml    # Docker Compose 编排（7 个服务，纯 image: 引用）
├── .env.template         # 环境变量模板（手动配置用）
├── healthcheck.sh        # 系统健康检查脚本
└── README.md             # 本文件
```

## 系统要求

- Pi Desktop / Docker Desktop 4.25+
- 至少 4GB 可用内存
- 20GB 可用磁盘空间
- 网络连接（用于拉取 Docker 镜像）

## 包含的服务

| 服务          | 镜像                                                            | 端口 | 说明               |
| ------------- | --------------------------------------------------------------- | ---- | ------------------ |
| PostgreSQL 15 | `postgres:15-alpine`                                            | 内部 | 主数据库           |
| Redis 7       | `redis:7-alpine`                                                | 内部 | BullMQ 队列        |
| Migration     | `ghcr.io/chunmeiyunqi-stack/pi-merchant-framework:latest`       | —    | 一次性数据库迁移   |
| Main App      | `ghcr.io/chunmeiyunqi-stack/pi-merchant-framework:latest`       | 3000 | Next.js 前端 + API |
| Admin         | `ghcr.io/chunmeiyunqi-stack/pi-merchant-framework-admin:latest` | 3001 | 管理后台           |
| Worker        | `ghcr.io/chunmeiyunqi-stack/pi-merchant-framework:latest`       | —    | AI 图片生成 Worker |
| Nginx         | `nginx:alpine`                                                  | 80   | 反向代理（可选）   |

## 一键启动

### 方式 A（推荐）：通过 SoloHost 面板

1. 在 Pi Desktop 中导入本目录
2. SoloHost 加载 `config_options.yml`，显示配置向导
3. 填写数据库连接、API 密钥等必填项
4. 点击"部署"，SoloHost 自动拉取镜像并启动所有服务

### 方式 B：手动终端部署

```bash
# 1. 进入 solo-host 目录
cd pi-merchant-framework/solo-host

# 2. 复制环境变量模板并编辑
cp .env.template .env
# 编辑 .env，填入真实密钥和 API Key

# 3. 拉取镜像并启动所有服务
docker compose up -d

# 4. 验证部署
chmod +x healthcheck.sh
./healthcheck.sh
```

## 首次使用

1. 访问 `http://localhost:3000` 进入主应用
2. 使用 Pi Wallet 扫码登录
3. 访问 `http://localhost:3001` 进入管理后台

## 环境变量配置

| 变量                  | 必填 | 类型     | 说明                        |
| --------------------- | ---- | -------- | --------------------------- |
| `DATABASE_URL`        | ✅   | string   | PostgreSQL 连接串           |
| `REDIS_URL`           | ✅   | string   | Redis 连接串                |
| `NEXT_PUBLIC_APP_URL` | ✅   | string   | 应用访问地址                |
| `JWT_SECRET`          | ✅   | password | 32字节 hex 密钥             |
| `PI_SESSION_SECRET`   | ✅   | password | 32字节 hex 密钥             |
| `PI_API_KEY`          | ✅   | password | Pi Developer Dashboard 获取 |
| `OPENAI_API_KEY`      | ✅   | password | OpenAI API 密钥             |
| `AI_PRIMARY_PROVIDER` | 可选 | select   | 默认 `openai`               |
| `WORKER_CONCURRENCY`  | 可选 | string   | 默认 `3`                    |

完整变量列表见 [.env.template](.env.template)。

## Docker 镜像说明

所有应用镜像托管在 GitHub Container Registry：

```
ghcr.io/chunmeiyunqi-stack/pi-merchant-framework:latest        # App + Worker + Migration
ghcr.io/chunmeiyunqi-stack/pi-merchant-framework-admin:latest   # Admin Dashboard
```

如需构建自定义镜像，在仓库根目录执行：

```bash
docker build -t my-registry/pi-merchant-framework:latest -f Dockerfile .
docker build -t my-registry/pi-merchant-framework-admin:latest -f Dockerfile.admin .
```

然后修改 `docker-compose.yml` 中的 `image:` 指向你的镜像仓库。

## 常用命令

```bash
# 查看所有服务日志
docker compose -f solo-host/docker-compose.yml logs -f

# 查看 Worker 日志
docker compose -f solo-host/docker-compose.yml logs -f worker

# 停止所有服务
docker compose -f solo-host/docker-compose.yml down

# 停止并删除数据卷（谨慎！会丢失数据）
docker compose -f solo-host/docker-compose.yml down -v

# 健康检查
bash solo-host/healthcheck.sh
```

## 架构图

```
                  ┌──────────┐
                  │  Nginx   │ :80  (可选)
                  └────┬─────┘
               ┌───────┴────────┐
          ┌────▼────┐     ┌─────▼────┐
          │  App    │     │  Admin   │
          │ :3000   │     │ :3001    │
          └────┬────┘     └──────────┘
               │
     ┌─────────┴──────────┐
     │     Worker (BullMQ) │
     └─────────┬──────────┘
               │
     ┌─────────┴──────────┐     ┌──────────────────┐
     │     Redis 7        │     │  PostgreSQL 15   │
     │     (Queue)        │     │  (Database)      │
     └────────────────────┘     └──────────────────┘
```

## 启动顺序

```
db ──→ redis ──→ migrate ──→ app + admin + worker ──→ nginx
```

## SoloHost Publish Flow

Before publishing to Pi Desktop SoloHost, you must build and push Docker images to a public registry.

### Step 1: Make GHCR packages public (one-time)

1. Go to https://github.com/orgs/chunmeiyunqi-stack/packages
2. Open **pi-merchant-framework** → Package Settings → Change visibility to **Public**
3. Open **pi-merchant-framework-admin** → Package Settings → Change visibility to **Public**

### Step 2: Publish images

$`bash
chmod +x solo-host/publish-images.sh
bash solo-host/publish-images.sh
``n
Or push to main branch to trigger automatic GHCR build via GitHub Actions.

### Step 3: Verify images

$`bash
bash solo-host/verify-images.sh
``n

### Step 4: Install via Pi Desktop SoloHost

1. In Pi Desktop, open SoloHost
2. Click **Publish an app** → select the $`solo-host/ directory
3. Fill in the configuration form (domain, API keys, AI provider)
4. Click deploy — SoloHost pulls images and starts all containers
