// ============================================================
// 多租户 Prisma Middleware - Unit Tests
// Tests: applyTenantMiddleware 自动注入 merchantId
// ============================================================
import { applyTenantMiddleware } from '../../tenant/prisma-middleware';

// Mock AsyncLocalStorage context
jest.mock('../../tenant/context', () => {
  let currentId: string | undefined;
  return {
    getTenantId: jest.fn(() => currentId),
    runWithTenant: jest.fn(<T>(id: string, fn: () => T): T => {
      currentId = id;
      try {
        return fn();
      } finally {
        currentId = undefined;
      }
    }),
  };
});

import { getTenantId, runWithTenant } from '../../tenant/context';

describe('applyTenantMiddleware', () => {
  let mockPrisma: { $use: jest.Mock };
  let middlewareFn: (params: any, next: jest.Mock) => Promise<unknown>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Capture the middleware when applied
    mockPrisma = {
      $use: jest.fn((fn: any) => {
        middlewareFn = fn;
      }),
    };

    applyTenantMiddleware(mockPrisma as any);
    expect(mockPrisma.$use).toHaveBeenCalledTimes(1);
  });

  // ── Test 1: findMany 时自动注入 merchantId ────────────
  describe('findMany', () => {
    it('injects merchantId into where clause when tenant context exists', async () => {
      const mockNext = jest.fn().mockResolvedValue([]);
      const params = {
        model: 'Order',
        action: 'findMany',
        args: { where: { status: 'active' } },
      };

      await runWithTenant('merchant_001', async () => {
        await middlewareFn(params, mockNext);
      });

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.objectContaining({
            where: expect.objectContaining({ merchantId: 'merchant_001', status: 'active' }),
          }),
        })
      );
    });

    it('does not inject merchantId when no tenant context', async () => {
      const mockNext = jest.fn().mockResolvedValue([]);
      const params = {
        model: 'Order',
        action: 'findMany',
        args: { where: { status: 'active' } },
      };

      await middlewareFn(params, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.objectContaining({
            where: expect.objectContaining({ status: 'active' }),
          }),
        })
      );
      // merchantId should NOT be present
      const calledParams = mockNext.mock.calls[0][0];
      expect(calledParams.args.where.merchantId).toBeUndefined();
    });

    it('injects merchantId for GenerationHistory model', async () => {
      const mockNext = jest.fn().mockResolvedValue([]);
      const params = {
        model: 'GenerationHistory',
        action: 'findMany',
        args: { where: { piUid: 'pi-123' } },
      };

      await runWithTenant('merchant_002', async () => {
        await middlewareFn(params, mockNext);
      });

      const calledParams = mockNext.mock.calls[0][0];
      expect(calledParams.args.where.merchantId).toBe('merchant_002');
      expect(calledParams.args.where.piUid).toBe('pi-123');
    });
  });

  // ── Test 2: create 时自动注入 merchantId ────────────
  describe('create', () => {
    it('injects merchantId into data when tenant context exists', async () => {
      const mockNext = jest.fn().mockResolvedValue({ id: 'new-id' });
      const params = {
        model: 'Customer',
        action: 'create',
        args: { data: { name: 'Test Customer' } },
      };

      await runWithTenant('merchant_003', async () => {
        await middlewareFn(params, mockNext);
      });

      const calledParams = mockNext.mock.calls[0][0];
      expect(calledParams.args.data.merchantId).toBe('merchant_003');
      expect(calledParams.args.data.name).toBe('Test Customer');
    });

    it('does not inject for non-isolated model', async () => {
      const mockNext = jest.fn().mockResolvedValue({ id: 'new-id' });
      const params = {
        model: 'Merchant', // not in isolation whitelist
        action: 'create',
        args: { data: { name: 'Test Merchant' } },
      };

      await runWithTenant('merchant_004', async () => {
        await middlewareFn(params, mockNext);
      });

      const calledParams = mockNext.mock.calls[0][0];
      expect(calledParams.args.data.merchantId).toBeUndefined();
    });
  });

  // ── Test 3: findUnique / findFirst ────────────
  describe('findUnique / findFirst', () => {
    it('injects merchantId into findUnique where clause', async () => {
      const mockNext = jest.fn().mockResolvedValue(null);
      const params = {
        model: 'Order',
        action: 'findUnique',
        args: { where: { id: 'order-123' } },
      };

      await runWithTenant('merchant_005', async () => {
        await middlewareFn(params, mockNext);
      });

      const calledParams = mockNext.mock.calls[0][0];
      expect(calledParams.args.where.merchantId).toBe('merchant_005');
      expect(calledParams.args.where.id).toBe('order-123');
    });

    it('injects merchantId into findFirst where clause', async () => {
      const mockNext = jest.fn().mockResolvedValue(null);
      const params = {
        model: 'Customer',
        action: 'findFirst',
        args: { where: { email: 'test@test.com' } },
      };

      await runWithTenant('merchant_006', async () => {
        await middlewareFn(params, mockNext);
      });

      const calledParams = mockNext.mock.calls[0][0];
      expect(calledParams.args.where.merchantId).toBe('merchant_006');
    });
  });

  // ── Test 4: update / delete ────────────
  describe('update / delete', () => {
    it('injects merchantId into update where clause', async () => {
      const mockNext = jest.fn().mockResolvedValue({ id: 'order-123', status: 'updated' });
      const params = {
        model: 'Order',
        action: 'update',
        args: { where: { id: 'order-123' }, data: { status: 'shipped' } },
      };

      await runWithTenant('merchant_007', async () => {
        await middlewareFn(params, mockNext);
      });

      const calledParams = mockNext.mock.calls[0][0];
      expect(calledParams.args.where.merchantId).toBe('merchant_007');
    });

    it('injects merchantId into delete where clause', async () => {
      const mockNext = jest.fn().mockResolvedValue({ id: 'order-123' });
      const params = {
        model: 'Order',
        action: 'delete',
        args: { where: { id: 'order-123' } },
      };

      await runWithTenant('merchant_008', async () => {
        await middlewareFn(params, mockNext);
      });

      const calledParams = mockNext.mock.calls[0][0];
      expect(calledParams.args.where.merchantId).toBe('merchant_008');
    });
  });

  // ── Test 5: Error handling ────────────
  describe('error handling', () => {
    it('does not throw when args is undefined', async () => {
      const mockNext = jest.fn().mockResolvedValue(null);
      const params = {
        model: 'Order',
        action: 'findMany',
        // args is intentionally undefined
      };

      await runWithTenant('merchant_009', async () => {
        await expect(middlewareFn(params, mockNext)).resolves.not.toThrow();
      });
    });

    it('does not throw when next callback throws, but bubbles the error', async () => {
      const mockNext = jest.fn().mockRejectedValue(new Error('DB Error'));
      const params = {
        model: 'Order',
        action: 'findMany',
        args: { where: { status: 'active' } },
      };

      await runWithTenant('merchant_010', async () => {
        await expect(middlewareFn(params, mockNext)).rejects.toThrow('DB Error');
      });
    });
  });
});
