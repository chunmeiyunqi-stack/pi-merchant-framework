import type { PrismaClient, Prisma } from '@prisma/client';
import { getTenantId } from './context';

/**
 * Apply tenant-aware Prisma middleware to automatically inject `merchantId`
 * into query filters for tenant-scoped models.
 *
 * Security boundary:
 * - This middleware only adds a `merchantId` constraint when a tenant id
 *   is present in the current AsyncLocalStorage context.
 * - It targets a whitelist of models that must be isolated to prevent data
 *   leakage across merchants.
 * - It will not overwrite explicit `where` clauses that already contain
 *   stronger constraints, but will merge `merchantId` when absent.
 *
 * Usage:
 *   import { applyTenantMiddleware } from '@pi-merchant/pi-sdk';
 *   applyTenantMiddleware(prisma);
 */
export function applyTenantMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params: any, next: (params: any) => Promise<unknown>) => {
    const tenantId = getTenantId();

    const modelsRequiringIsolation = [
      'Customer',
      'Order',
      'Payment',
      'Booking',
      'Membership',
      'Service',
      'GenerationHistory',
    ];

    try {
      if (tenantId && params.model && modelsRequiringIsolation.includes(params.model)) {
        params.args = params.args || {};

        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.args.where = { ...params.args.where, merchantId: tenantId };
        } else if (params.action === 'create' && params.args.data) {
          params.args.data = { ...params.args.data, merchantId: tenantId };
        } else if (
          params.action === 'findMany' ||
          params.action === 'updateMany' ||
          params.action === 'deleteMany'
        ) {
          params.args.where = { ...params.args.where, merchantId: tenantId };
        } else if (params.action === 'update' || params.action === 'delete') {
          params.args.where = { ...params.args.where, merchantId: tenantId };
        }
      }
    } catch (_e) {
      // In case of unexpected shapes, do not block the request; log upstream instead.
    }

    return next(params);
  });
}
