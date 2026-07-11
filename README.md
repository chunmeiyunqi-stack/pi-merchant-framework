# Pi Merchant Framework

> **Production-ready, white-label merchant application framework built on Pi Network ecosystem**
>
> Next.js 14 | TypeScript Strict | Prisma | BullMQ | Turborepo | PostgreSQL

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Vercel (Serverless)                │
│  ┌────────────────────────────────────────────────┐  │
│  │           apps/web (Next.js 14)                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │ Frontend │  │ API      │  │ Swagger Docs │ │  │
│  │  │ (RSC)    │  │ Routes   │  │ (/api/docs)  │ │  │
│  │  └──────────┘  └──────────┘  └──────────────┘ │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                  Docker / VPS                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Admin    │  │ BullMQ   │  │ Redis            │   │
│  │ (Next.js)│  │ Worker   │  │ (Queue + Cache)  │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│               Shared Packages (Monorepo)              │
│  @pi-merchant/pi-sdk  @pi-merchant/types             │
│  @pi-merchant/config  @pi-merchant/ui                │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│          PostgreSQL 15 (Neon / Supabase / Docker)    │
│  Prisma ORM · Multi-Tenant · Row-Level Security      │
└──────────────────────────────────────────────────────┘
```

## Features

| Feature                    | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| 🔐 **Pi Network Auth**     | Pi Sign-In + JWT session management                      |
| 🧾 **License System**      | RSA-signed license payloads with hardware binding        |
| 👥 **Multi-Tenant**        | Tenant isolation via Prisma middleware                   |
| 🎨 **AI Image Generation** | Multi-provider (OpenAI, Anthropic, Ollama) with fallback |
| ⏱️ **Async Queue**         | BullMQ + Redis with exponential backoff retry            |
| 💰 **Pi Payments**         | Webhook signature verification (HMAC-SHA256)             |
| 📊 **Usage Quotas**        | Per-tenant rate limiting and quota tracking              |
| 🌐 **Swagger Docs**        | Auto-generated API documentation at `/api/docs`          |

## Quick Start

### Prerequisites

- Node.js 20.x
- pnpm 8.x
- PostgreSQL 15+
- Redis 7+ (for queue worker)

### 1. Clone & Install

```bash
git clone https://github.com/chunmeiyunqi-stack/pi-merchant-framework.git
cd pi-merchant-framework
pnpm install
```

### 2. Setup Database

```bash
# Copy environment file
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma client & migrate
pnpm prisma generate
pnpm prisma db push
pnpm db:seed
```

### 3. Run Development

```bash
pnpm dev
# → Frontend: http://localhost:3000
# → API Docs: http://localhost:3000/api/docs
```

### 4. Run Tests

```bash
pnpm test
pnpm test:coverage
```

## Production Deployment

### Vercel (Frontend + API)

```bash
# Configure in Vercel Dashboard:
# Install:  pnpm install --frozen-lockfile
# Build:    pnpm turbo run build --filter=@pi-merchant/web
# Node:     20.x
```

Set environment variables in Vercel Dashboard — see [docs/deployment/ENVIRONMENT.md](docs/deployment/ENVIRONMENT.md).

### Docker (Worker + Admin + Redis)

```bash
docker compose -f docker-compose.prod.yml up -d
```

See [docs/deployment/DOCKER-WORKER.md](docs/deployment/DOCKER-WORKER.md).

## Project Structure

```
pi-merchant-framework/
├── apps/
│   ├── web/          # Next.js 14 main app (Vercel)
│   └── admin/        # Admin dashboard (Docker)
├── packages/
│   ├── pi-sdk/       # Pi Network SDK (npm-publishable)
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Shared configuration
│   └── ui/           # Shared UI components
├── deploy/
│   └── nginx/        # Nginx config for Docker
├── docs/
│   └── deployment/   # Deployment guides
├── prisma/           # Database schema
└── scripts/          # Utilities (license signing, etc.)
```

## Documentation

- [Deployment Guide](docs/deployment/VERCEL.md) — Vercel production setup
- [Worker Guide](docs/deployment/DOCKER-WORKER.md) — BullMQ worker deployment
- [Environment Variables](docs/deployment/ENVIRONMENT.md) — Full env reference
- [System Architecture](docs/architecture.md) — Detailed architecture docs
- [Database Design](docs/database-design.md) — Schema documentation
- [Payment Flow](docs/payment-flow.md) — Pi payment integration

## License

Pioneer AI Merchant Framework — Commercial License
