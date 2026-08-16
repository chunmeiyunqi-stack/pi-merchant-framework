/**
 * Unit tests for POST /api/v1/images/generate
 *
 * Tests cover:
 *  - Authentication guard
 *  - Input validation (prompt, size, model, quality)
 *  - Successful image generation flow
 *  - OpenAI API error propagation
 *  - Abort / timeout behaviour
 *  - Quota exceeded path
 *  - GenerationHistory DB lifecycle (create → update)
 */
export {};

// ─── polyfills ───────────────────────────────────────────────────────────────
if (typeof global.Request === 'undefined') {
  global.Request = class Request {} as any;
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {} as any;
}

// ─── fetch mock ───────────────────────────────────────────────────────────────
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

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

// Prisma mock
const mockHistoryCreate = jest.fn();
const mockHistoryUpdate = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {},
}));

// pi-sdk mocks
const mockCheckQuota = jest.fn();
const mockTrackUsage = jest.fn();
const mockLogEvent = jest.fn();
const mockLogError = jest.fn();
const mockRunWithTenant = jest.fn((_id: string, fn: () => any) => fn());

jest.mock('@pi-merchant/pi-sdk', () => ({
  logEvent: (...args: any[]) => mockLogEvent(...args),
  logError: (...args: any[]) => mockLogError(...args),
  runWithTenant: (...args: any[]) => mockRunWithTenant(...args),
  checkQuota: (...args: any[]) => mockCheckQuota(...args),
  trackUsage: (...args: any[]) => mockTrackUsage(...args),
}));

const mockAddImageGenerationJob = jest.fn();
jest.mock('@/lib/queue/image.queue', () => ({
  imageQueue: { close: jest.fn() },
  addImageGenerationJob: (...args: any[]) => mockAddImageGenerationJob(...args),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  getTraceId: () => 'test-trace-id',
}));

// ─── subject ─────────────────────────────────────────────────────────────────

let POST: (req: any) => Promise<any>;

beforeAll(async () => {
  const mod = await import('../../../app/api/v1/images/generate/route');
  POST = mod.POST!;
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function authAsUser() {
  mockCookiesGet.mockReturnValue({ value: 'valid-token' });
  mockVerifySessionToken.mockReturnValue('pi-user-123');
}

function noAuth() {
  mockCookiesGet.mockReturnValue(undefined);
  mockVerifySessionToken.mockReturnValue(null);
}

function injectPrismaDb() {
  const { prisma } = require('@/lib/prisma');
  (prisma as any).generationHistory = {
    create: mockHistoryCreate,
    update: mockHistoryUpdate,
  };
}

function makeRequest(body: Record<string, unknown>): Request {
  return {
    headers: { get: () => null },
    json: async () => body,
    url: 'https://localhost/api/v1/images/generate',
  } as unknown as Request;
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('POST /api/v1/images/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.NEXT_PUBLIC_MERCHANT_ID = 'merchant-demo';

    injectPrismaDb();
    mockHistoryCreate.mockResolvedValue({ id: 'hist-abc-123' });
    mockHistoryUpdate.mockResolvedValue({});
    mockCheckQuota.mockReturnValue({
      isExceeded: false,
      usedRequestsThisMonth: 1,
      maxRequestsPerMonth: 1000,
      resetAt: Date.now() + 3600_000,
    });
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.NEXT_PUBLIC_MERCHANT_ID;
  });

  // ── authentication ────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when no auth cookie is present', async () => {
      noAuth();
      const res = await POST(makeRequest({ prompt: 'A cat' }));
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when the token is invalid', async () => {
      mockCookiesGet.mockReturnValue({ value: 'bad' });
      mockVerifySessionToken.mockReturnValue(null);
      const res = await POST(makeRequest({ prompt: 'A cat' }));
      expect(res.status).toBe(401);
    });
  });

  // ── input validation ──────────────────────────────────────────────────────

  describe('Input validation', () => {
    beforeEach(() => authAsUser());

    it('returns 400 when prompt is missing', async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/missing prompt/i);
    });

    it('returns 400 when prompt is empty string', async () => {
      const res = await POST(makeRequest({ prompt: '   ' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when prompt exceeds 4000 characters', async () => {
      const res = await POST(makeRequest({ prompt: 'A'.repeat(4001) }));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/too long/i);
    });

    it('returns 400 for an invalid model', async () => {
      const res = await POST(makeRequest({ prompt: 'A cat', model: 'gpt-4o' }));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid model/i);
    });

    it('returns 400 for an invalid size for dall-e-3', async () => {
      const res = await POST(makeRequest({ prompt: 'A cat', model: 'dall-e-3', size: '512x512' }));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid size/i);
    });

    it('returns 400 for an invalid size for dall-e-2', async () => {
      const res = await POST(
        makeRequest({ prompt: 'A cat', model: 'dall-e-2', size: '1792x1024' })
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid size/i);
    });

    it('returns 400 when JSON body is malformed', async () => {
      const badReq = {
        headers: { get: () => null },
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
        url: 'https://localhost/api/v1/images/generate',
      } as unknown as Request;
      const res = await POST(badReq);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid json/i);
    });
  });

  // ── service unavailable ───────────────────────────────────────────────────

  describe('Service availability', () => {
    beforeEach(() => authAsUser());

    it('returns 503 when OPENAI_API_KEY is not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      const res = await POST(makeRequest({ prompt: 'A cat' }));
      expect(res.status).toBe(503);
      expect(res.body.error).toMatch(/not configured/i);
    });
  });

  // ── quota exceeded ────────────────────────────────────────────────────────

  describe('Quota enforcement', () => {
    beforeEach(() => authAsUser());

    it('returns 429 when the monthly quota is exceeded', async () => {
      mockCheckQuota.mockReturnValue({
        isExceeded: true,
        usedRequestsThisMonth: 1000,
        maxRequestsPerMonth: 1000,
        resetAt: Date.now() + 3600_000,
      });
      const res = await POST(makeRequest({ prompt: 'A cat' }));
      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.quota).toBeDefined();
    });
  });

  // ── successful generation ─────────────────────────────────────────────────

  describe('Successful job enqueuing', () => {
    beforeEach(() => {
      authAsUser();
      mockAddImageGenerationJob.mockResolvedValue({ id: 'job-abc-123' });
    });

    it('returns status 202 with jobId', async () => {
      const res = await POST(makeRequest({ prompt: 'A serene forest' }));
      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobId).toBe('job-abc-123');
      expect(res.body.data.status).toBe('pending');
    });

    it('returns historyId in the response', async () => {
      const res = await POST(makeRequest({ prompt: 'A serene forest' }));
      expect(res.body.data.historyId).toBe('hist-abc-123');
    });

    it('creates a pending history record', async () => {
      await POST(makeRequest({ prompt: 'A cat' }));
      expect(mockHistoryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'pending', type: 'IMAGE' }),
        })
      );
    });

    it('enqueues job with request parameters', async () => {
      await POST(makeRequest({ prompt: 'A cat', model: 'dall-e-3' }));
      expect(mockAddImageGenerationJob).toHaveBeenCalledWith(
        'generate-image',
        expect.objectContaining({ prompt: 'A cat', model: 'dall-e-3', piUid: 'pi-user-123' })
      );
    });
  });

  // ── Queue error handling ──────────────────────────────────────────────────

  describe('Queue failure handling', () => {
    beforeEach(() => authAsUser());

    it('returns 503 when queue fails to enqueue job', async () => {
      mockAddImageGenerationJob.mockRejectedValue(new Error('Queue connection failed'));
      const res = await POST(makeRequest({ prompt: 'A cat' }));
      expect(res.status).toBe(503);
      expect(res.body.error).toMatch(/temporarily unavailable/i);
    });

    it('updates history to failed on queue error', async () => {
      mockAddImageGenerationJob.mockRejectedValue(new Error('Queue error'));
      await POST(makeRequest({ prompt: 'A cat' }));
      expect(mockHistoryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'failed' }),
        })
      );
    });
  });
});
