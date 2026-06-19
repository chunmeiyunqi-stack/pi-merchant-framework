# Multi-stage Dockerfile for Next.js (Turborepo / pnpm)
#
# 🔒 Security Policy (v2.1.0+):
#   - No production secrets are baked into the image.
#   - Build-time env vars use clearly-marked placeholder values required only for
#     Prisma client generation and Next.js build (which evaluates `process.env.X`
#     at build time for static pages). These are NOT runtime secrets.
#   - All runtime secrets (PI_API_KEY, PI_SESSION_SECRET, LICENSE_PAYLOAD_SECRET,
#     DATABASE_URL, OPENAI_API_KEY, etc.) MUST be injected at container start
#     via `docker run -e`, `docker-compose env_file`, or orchestrator secrets.
#   - The container runs as a non-root user (`nextjs`).

# ---- Builder ----
# Switch to Debian slim base to provide libssl1.1 for Prisma
FROM node:20-bullseye-slim AS builder

# Install dependencies required for building (pnpm) and OpenSSL 1.1
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash curl git python3 python3-dev make g++ ca-certificates openssl libssl1.1 \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

WORKDIR /app

# Copy package manifests first to leverage cache
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./
COPY packages ./packages
COPY apps ./apps
COPY src ./src
COPY prisma ./prisma

# Install and build
ENV NODE_ENV=production
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
ENV NPM_CONFIG_STRICT_SSL=false
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PNPM_FETCH_RETRIES=3
ENV PNPM_FETCH_TIMEOUT=300000
ENV PNPM_NETWORK_CONCURRENCY=5
ENV PNPM_FETCH_RETRY_MAXTIMEOUT=600000

# 🔒 Build-time only placeholders (NOT runtime secrets)
# These are needed because:
#   1. `prisma generate` postinstall needs a valid DATABASE_URL shape (won't actually connect)
#   2. Next.js build evaluates some process.env.X at build time for static optimization
# The real secrets are injected at runtime via env_file or -e flags.
# Marked with BUILD_PLACEHOLDER_ prefix so audits can distinguish them from leaked secrets.
ENV DATABASE_URL="postgresql://BUILD_PLACEHOLDER:BUILD_PLACEHOLDER@127.0.0.1:5432/BUILD_PLACEHOLDER?schema=public"
ENV PI_API_KEY="BUILD_PLACEHOLDER"
ENV LICENSE_PAYLOAD_SECRET="BUILD_PLACEHOLDER"
ENV PI_SESSION_SECRET="BUILD_PLACEHOLDER_DO_NOT_USE_AT_RUNTIME_needs_32_chars_xx"
ENV OPENAI_API_KEY="BUILD_PLACEHOLDER"
ENV ANTHROPIC_API_KEY="BUILD_PLACEHOLDER"
ENV JWT_SECRET="BUILD_PLACEHOLDER_DO_NOT_USE_AT_RUNTIME_needs_32_chars_xx"
ENV NEXTAUTH_SECRET="BUILD_PLACEHOLDER_DO_NOT_USE_AT_RUNTIME_needs_32_chars_xx"

# Use a local pnpm store inside the builder and hoist packages to avoid symlinks to external stores
# Temporarily set NODE_ENV=development so devDependencies (e.g. prisma) are installed for postinstall
RUN NODE_ENV=development pnpm install --frozen-lockfile --reporter=default --store-dir=.pnpm-store --shamefully-hoist
# Disable declaration generation for tsup in Docker to avoid DTS resolution issues during CI builds
RUN sed -i 's/--dts//g' packages/pi-sdk/package.json || true
RUN pnpm build

# ---- Runner ----
FROM node:20-bullseye-slim AS runner

# Create non-root user and ensure openssl is available at runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl libssl1.1 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -r nextjs && useradd -r -g nextjs nextjs

WORKDIR /app

# Copy Next standalone build and public from the web app built in the monorepo
# The turborepo places Next build outputs under /app/apps/web/.next
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Use a non-root user for security
USER nextjs

# 🔒 Runtime env vars — ONLY non-sensitive defaults here.
# All secrets must be provided via `docker run -e VAR=...` or docker-compose `env_file`.
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- --tries=1 --timeout=2 http://127.0.0.1:3000/api/health || exit 1

CMD ["node", ".next/standalone/server.js"]