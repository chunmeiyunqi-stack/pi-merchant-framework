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
    json: async () => body,
    url: 'https://localhost/api/v1/images/generate',
  } as unknown as Request;
}

function dalleSuccessResponse(url = 'https://openai.com/img/test.png') {
  return {
    ok: true,
    json: async () => ({
      created: Date.now(),
      data: [{ url, revised_prompt: 'A beautiful cat' }],
    }),
  } as Response;
}

function dalleErrorResponse(status = 400, message = 'Bad request') {
  return {
    ok: false,
    status,
    text: async () => JSON.stringify({ error: { message } }),
  } as unknown as Response;
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

  describe('Successful generation', () => {
    beforeEach(() => {
      authAsUser();
      mockFetch.mockResolvedValue(dalleSuccessResponse());
    });

    it('returns success=true with images array', async () => {
      const res = await POST(makeRequest({ prompt: 'A serene forest' }));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.images)).toBe(true);
    });

    it('returns historyId in the response', async () => {
      const res = await POST(makeRequest({ prompt: 'A serene forest' }));
      expect(res.body.data.historyId).toBe('hist-abc-123');
    });

    it('returns model and provider metadata', async () => {
      const res = await POST(makeRequest({ prompt: 'A serene forest' }));
      expect(res.body.data.model).toBe('dall-e-3');
      expect(res.body.data.provider).toBe('openai');
    });

    it('creates a pending history record before calling OpenAI', async () => {
      await POST(makeRequest({ prompt: 'A cat' }));
      expect(mockHistoryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'pending', type: 'IMAGE' }),
        })
      );
    });

    it('updates history record to completed after success', async () => {
      await POST(makeRequest({ prompt: 'A cat' }));
      expect(mockHistoryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'completed' }),
        })
      );
    });

    it('calls trackUsage with success=true', async () => {
      await POST(makeRequest({ prompt: 'A cat' }));
      expect(mockTrackUsage).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('uses dall-e-2 when explicitly requested', async () => {
      const res = await POST(
        makeRequest({ prompt: 'A house', model: 'dall-e-2', size: '512x512' })
      );
      expect(res.status).toBe(200);
      expect(res.body.data.model).toBe('dall-e-2');
    });
  });

  // ── OpenAI API errors ─────────────────────────────────────────────────────

  describe('OpenAI API error propagation', () => {
    beforeEach(() => authAsUser());

    it('returns 400 when OpenAI returns a 4xx error', async () => {
      mockFetch.mockResolvedValue(dalleErrorResponse(400, 'Invalid prompt'));
      const res = await POST(makeRequest({ prompt: 'A cat' }));
      // 4xx from OpenAI → route returns 400
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid prompt');
    });

    it('returns 502 when OpenAI returns a 5xx error', async () => {
      mockFetch.mockResolvedValue(dalleErrorResponse(500, 'OpenAI server error'));
      const res = await POST(makeRequest({ prompt: 'A cat' }));
      expect(res.status).toBe(502);
    });

    it('updates history to failed when OpenAI returns an error', async () => {
      mockFetch.mockResolvedValue(dalleErrorResponse(400, 'Content policy violated'));
      await POST(makeRequest({ prompt: 'A cat' }));
      expect(mockHistoryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'failed' }),
        })
      );
    });
  });

  // ── timeout ───────────────────────────────────────────────────────────────

  describe('Timeout handling', () => {
    beforeEach(() => authAsUser());

    it('returns 504 when the fetch aborts due to timeout', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      mockFetch.mockRejectedValue(abortError);

      const res = await POST(makeRequest({ prompt: 'A cat' }));
      expect(res.status).toBe(504);
      expect(res.body.error).toMatch(/timed out/i);
    });

    it('returns 500 for generic network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));
      const res = await POST(makeRequest({ prompt: 'A cat' }));
      expect(res.status).toBe(500);
    });

    it('updates history to failed on timeout', async () => {
      const abortError = new DOMException('Aborted', 'AbortError');
      mockFetch.mockRejectedValue(abortError);

      await POST(makeRequest({ prompt: 'A cat' }));
      expect(mockHistoryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'failed' }),
        })
      );
    });
  });
});
