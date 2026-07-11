# Docker Worker Deployment

## Services

1. **BullMQ Worker** - `apps/web/src/workers/image.worker.ts`
2. **Redis** - Required by BullMQ
3. **Next.js App (standalone)** - Optional if API routes need worker co-location

## Docker Compose

See deploy/docker-compose.prod.yml (coming soon).

## Graceful Shutdown

Worker handles SIGTERM:

- Closes BullMQ connection
- Finishes current jobs
- Exits cleanly within 10s

## Environment

- `REDIS_URL` - Required for BullMQ connection
- `DATABASE_URL` - Required for Prisma
- `WORKER_CONCURRENCY` - Optional (default: 3)
- All AI API keys
