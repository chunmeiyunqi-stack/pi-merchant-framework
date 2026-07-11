# Pi Merchant Framework — Delivery Overview

## Package Contents

| Item           | Location                   | Description                      |
| -------------- | -------------------------- | -------------------------------- |
| Main App       | `apps/web/`                | Next.js 14 app (Vercel-deployed) |
| Admin Panel    | `apps/admin/`              | Admin dashboard (Docker)         |
| Pi SDK         | `packages/pi-sdk/`         | npm-publishable Pi Network SDK   |
| Types          | `packages/types/`          | Shared TypeScript definitions    |
| Config         | `packages/config/`         | Shared configuration             |
| UI Kit         | `packages/ui/`             | Shared React components          |
| Nginx Config   | `deploy/nginx/`            | Reverse proxy config             |
| Docker Compose | `docker-compose.prod.yml`  | Full stack orchestration         |
| Demo Project   | `examples/basic-merchant/` | Minimal integration example      |

## Architecture Summary

- **Frontend**: Vercel (serverless, auto-scaling)
- **API Routes**: Next.js API handlers (Vercel serverless functions)
- **Worker**: BullMQ on Docker/VPS (long-running background jobs)
- **Database**: PostgreSQL 15 via Prisma ORM
- **Queue**: Redis 7+ for BullMQ
- **Auth**: Pi Network Sign-In + JWT
- **AI**: Multi-provider routing (OpenAI, Anthropic, Ollama)
- **Payments**: Pi Network blockchain payment webhooks

## Deployment Options

1. **Vercel Only** — Frontend + API (no queue)
2. **Vercel + Docker** — Frontend on Vercel, Worker on Docker
3. **Full Docker** — Everything self-hosted

## Environment Requirements

| Service        | Required  | Provider                      |
| -------------- | --------- | ----------------------------- |
| PostgreSQL 15  | Yes       | Neon / Supabase / Self-hosted |
| Redis 7+       | For queue | Upstash / Self-hosted         |
| OpenAI API Key | For AI    | OpenAI                        |
| Pi API Key     | For auth  | Pi Developer Dashboard        |

## Version

**v2.1.0** — Production Release (git tag: `v2.1.0-production`)
