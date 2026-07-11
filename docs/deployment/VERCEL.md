# Vercel Deployment

- Build Command: `pnpm turbo run build --filter=@pi-merchant/web`
- Install Command: `pnpm install --frozen-lockfile`
- Node Version: 20.x
- Output: Serverless (Next.js default)

## Production Environment Variables

Configure in Vercel Dashboard → Settings → Environment Variables.

See `docs/deployment/ENVIRONMENT.md` for full variable list.

## Notes

- `next.config.js` uses `output: "standalone"` only for Docker builds (when `CI && !VERCEL`)
- Admin app (`apps/admin`) requires a **separate Vercel project** or Docker deployment
- BullMQ Worker + Redis **cannot** run on Vercel → use Docker/VPS
