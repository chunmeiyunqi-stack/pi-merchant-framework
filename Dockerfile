# =============================================================================
# Dockerfile — Pi Merchant Framework Web App (pnpm monorepo + output: 'standalone')
# Build: docker build -f Dockerfile -t pi-merchant-framework:latest .
# =============================================================================

# ---- Stage 1: deps ----
FROM node:22-alpine AS deps

# Install system dependencies (Chromium for Puppeteer, build tools)
RUN apk add --no-cache \
  libc6-compat \
  openssl \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  sed

# Enable pnpm (version pinned to match package.json)
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy workspace manifests (max cache hit)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig*.json ./

# Copy only package.json files for dependency resolution
COPY apps/web/package.json      ./apps/web/
COPY apps/admin/package.json    ./apps/admin/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json   ./packages/ui/
COPY packages/pi-sdk/package.json ./packages/pi-sdk/
COPY packages/config/package.json ./packages/config/

# Install dependencies (frozen lockfile for reproducible builds)
RUN pnpm install --no-frozen-lockfile

# ---- Stage 2: builder ----
FROM deps AS builder

WORKDIR /app

# Copy remaining source code
COPY prisma ./prisma
COPY packages ./packages
COPY apps ./apps

# Build-time env stubs (avoid connecting to real services)
ENV NODE_ENV=production
ENV DOCKER_BUILD=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV DISABLE_ESLINT_PLUGIN=true
ENV NEXT_SKIP_TYPECHECK=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV REDIS_URL="redis://localhost:6379"
ENV PI_API_KEY="build_time_dummy_key"
ENV PI_SESSION_SECRET="build_time_dummy_session_secret_32chars!"
ENV JWT_SECRET="build_time_dummy_jwt_secret_32chars!"
ENV LICENSE_PAYLOAD_SECRET="build_time_dummy_license_secret_32chars!"
ENV LICENSE_PAYLOAD="build_time_dummy_license_payload"
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Strip custom Prisma output so client is generated at default location
RUN sed -i '/output *=/d' prisma/schema.prisma

# Generate Prisma Client
RUN npx prisma generate

# Build web app (turbo handles dependency builds)
RUN pnpm --filter @pi-merchant/web build

# ---- Stage 3: runner ----
FROM node:22-alpine AS runner

# Minimal runtime deps (Chromium + SSL)
RUN apk add --no-cache \
  libc6-compat \
  openssl \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  && addgroup --system --gid 1001 nodejs \
  && adduser  --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV TZ=UTC
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy standalone output (Next.js puts server.js under apps/web/ when no outputFileTracingRoot)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy Prisma engine files (standalone may not include native binaries)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]