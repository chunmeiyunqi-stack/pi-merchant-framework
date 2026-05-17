// ============================================================
// Prisma Client 单例（防止开发模式热重载时连接耗尽）
// ============================================================

import { PrismaClient } from '@prisma/client';
import { applyTenantMiddleware } from '@pi-merchant/pi-sdk';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Apply tenant-aware middleware to enforce merchant isolation at DB layer.
// This will mutate the Prisma client instance to inject `merchantId` filters when
// a tenant id is present in AsyncLocalStorage.
try {
  applyTenantMiddleware(prisma);
} catch {
  // Fail-safe: avoid crashing startup if middleware cannot be applied in this environment
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
