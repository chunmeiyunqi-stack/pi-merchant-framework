# Multi-stage Dockerfile for Next.js web app (Turborepo / pnpm)

# ---- Builder ----
FROM node:20-bookworm-slim AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash curl git python3 python3-dev make g++ ca-certificates openssl libssl3 \
  && rm -rf /var/lib/apt/lists/*

# Pin pnpm to the version declared in package.json (8.15.0) to avoid lockfile conflicts
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy lockfile and workspace config first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Install dependencies with frozen lockfile (production stage needs devDeps for build)
ENV NODE_ENV=development
ENV NPM_CONFIG_REGISTRY=https://registry.npmjs.org
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_FETCH_RETRIES=3
ENV PNPM_FETCH_TIMEOUT=300000
ENV PNPM_NETWORK_CONCURRENCY=5

RUN pnpm install --frozen-lockfile --reporter=default --store-dir=.pnpm-store --shamefully-hoist

# Copy source after dependencies are cached
COPY packages ./packages
COPY apps ./apps
COPY src ./src

# Generate Prisma client and build
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/pi_merchant?schema=public"
ENV PI_API_KEY="dev"
ENV LICENSE_PAYLOAD_SECRET="dev"
ENV DOCKER_BUILD=1

RUN npx prisma generate \
  && pnpm build

# ---- Runner (web standalone) ----
FROM node:20-bookworm-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl libssl3 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -r nextjs && useradd -r -g nextjs nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nextjs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nextjs /app/prisma ./prisma

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

CMD ["node", "apps/web/server.js"]