/**
 * Unit tests for GET /api/v1/history
 *
 * Strategy: mock Next.js, session, prisma, pi-sdk, and metrics middleware
 * so the route handler can be exercised in isolation.
 */

// ─── polyfills ───────────────────────────────────────────────────────────────
if (typeof global.Request === 'undefined') {
  global.Request = class Request {} as any;
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {} as any;
}

// ─── mocks ───────────────────────────────────────────────────────────────────

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      body,
    })),
  },
}));

const mockCookiesGet = jest.fn();
jest.mock('next/headers', () => ({
  cookies: () => ({ get: mockCookiesGet }),
}));

const mockVerifySessionToken = jest.fn();
jest.mock('@/lib/session', () => ({
  verifySessionToken: mockVerifySessionToken,
}));

jest.mock('@/lib/metrics-middleware', () => ({
  withMetrics: (fn: (...args: any[]) => any) => fn,
}));

// Mock prisma — generationHistory will be replaced per test
const mockFindMany = jest.fn();
const mockCount = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {},
}));

// Mock runWithTenant to be a transparent pass-through
jest.mock('@pi-merchant/pi-sdk', () => ({
  runWithTenant: (_tenantId: string, fn: () => any) => fn(),
}));

// ─── subject ─────────────────────────────────────────────────────────────────

let GET: (req?: any) => Promise<any>;

beforeAll(async () => {
  const mod = await import('../../../app/api/v1/history/route');
  GET = mod.GET!;
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function authAsUser(uid = 'pi-user-uid-123') {
  mockCookiesGet.mockReturnValue({ value: 'valid-token' });
  mockVerifySessionToken.mockReturnValue(uid);
}

function noAuth() {
  mockCookiesGet.mockReturnValue(undefined);
  mockVerifySessionToken.mockReturnValue(null);
}

function injectPrismaDb(items: unknown[] = [], total = 0) {
  const { prisma } = require('@/lib/prisma');
  (prisma as any).generationHistory = {
    findMany: mockFindMany.mockResolvedValue(items),
    count: mockCount.mockResolvedValue(total),
  };
}

function makeRequest(searchParams: Record<string, string> = {}): Request {
  const params = new URLSearchParams(searchParams).toString();
  return { url: `https://localhost/api/v1/history${params ? '?' + params : ''}` } as Request;
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('GET /api/v1/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_MERCHANT_ID = 'test-merchant-001';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MERCHANT_ID;
  });

  // ── authentication ────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when no auth cookie exists', async () => {
      noAuth();
      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when the token is invalid', async () => {
      mockCookiesGet.mockReturnValue({ value: 'bad' });
      mockVerifySessionToken.mockReturnValue(null);
      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
    });
  });

  // ── successful response ───────────────────────────────────────────────────

  describe('Successful response', () => {
    const sampleItems = [
      {
        id: 'hist-1',
        type: 'IMAGE',
        provider: 'openai',
        model: 'dall-e-3',
        prompt: 'A cat',
        status: 'completed',
        createdAt: new Date(),
      },
      {
        id: 'hist-2',
        type: 'TEXT',
        provider: 'openai',
        model: 'gpt-4o',
        prompt: 'Hello',
        status: 'completed',
        createdAt: new Date(),
      },
    ];

    beforeEach(() => {
      authAsUser();
      injectPrismaDb(sampleItems, 2);
    });

    it('returns success=true and items array', async () => {
      const res = await GET(makeRequest());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('includes pagination metadata', async () => {
      const res = await GET(makeRequest());
      const { pagination } = res.body.data;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasMore');
    });

    it('defaults to page=1 and limit=20', async () => {
      await GET(makeRequest());
      expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
    });
  });

  // ── pagination params ─────────────────────────────────────────────────────

  describe('Pagination parameters', () => {
    beforeEach(() => {
      authAsUser();
      injectPrismaDb([], 100);
    });

    it('applies custom page and limit', async () => {
      await GET(makeRequest({ page: '3', limit: '10' }));
      // page=3, limit=10 → skip=20
      expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
    });

    it('caps limit at 50', async () => {
      await GET(makeRequest({ limit: '999' }));
      expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
    });

    it('floors page at 1 for invalid page values', async () => {
      await GET(makeRequest({ page: '-5' }));
      expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });

    it('totalPages is Math.ceil(total / limit)', async () => {
      injectPrismaDb([], 100);
      const res = await GET(makeRequest({ limit: '10' }));
      expect(res.body.data.pagination.totalPages).toBe(10);
    });

    it('hasMore is true when there are further pages', async () => {
      injectPrismaDb([], 100);
      const res = await GET(makeRequest({ page: '1', limit: '10' }));
      expect(res.body.data.pagination.hasMore).toBe(true);
    });

    it('hasMore is false on the last page', async () => {
      injectPrismaDb([], 5);
      const res = await GET(makeRequest({ page: '1', limit: '10' }));
      expect(res.body.data.pagination.hasMore).toBe(false);
    });
  });

  // ── type filtering ────────────────────────────────────────────────────────

  describe('Type filtering', () => {
    beforeEach(() => {
      authAsUser();
      injectPrismaDb([], 0);
    });

    it('passes type=IMAGE filter to prisma when provided', async () => {
      await GET(makeRequest({ type: 'IMAGE' }));
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'IMAGE' }),
        })
      );
    });

    it('passes type=TEXT filter to prisma when provided', async () => {
      await GET(makeRequest({ type: 'TEXT' }));
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'TEXT' }),
        })
      );
    });

    it('passes type=VIDEO filter to prisma when provided', async () => {
      await GET(makeRequest({ type: 'VIDEO' }));
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'VIDEO' }),
        })
      );
    });

    it('ignores invalid type values (no type filter applied)', async () => {
      await GET(makeRequest({ type: 'INVALID' }));
      const callWhere = mockFindMany.mock.calls[0][0].where;
      expect(callWhere).not.toHaveProperty('type');
    });
  });

  // ── tenant isolation ──────────────────────────────────────────────────────

  describe('Tenant isolation', () => {
    it('always filters by piUid from the session token', async () => {
      authAsUser('specific-uid-456');
      injectPrismaDb([], 0);
      await GET(makeRequest());
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ piUid: 'specific-uid-456' }),
        })
      );
    });

    it('always filters by merchantId from the environment (not request)', async () => {
      authAsUser();
      process.env.NEXT_PUBLIC_MERCHANT_ID = 'my-merchant';
      injectPrismaDb([], 0);
      await GET(makeRequest());
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ merchantId: 'my-merchant' }),
        })
      );
    });
  });

  // ── error handling ────────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('returns 500 when prisma throws', async () => {
      authAsUser();
      const { prisma } = require('@/lib/prisma');
      (prisma as any).generationHistory = {
        findMany: jest.fn().mockRejectedValue(new Error('DB offline')),
        count: jest.fn().mockResolvedValue(0),
      };

      const res = await GET(makeRequest());
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('DB offline');
    });
  });
});
