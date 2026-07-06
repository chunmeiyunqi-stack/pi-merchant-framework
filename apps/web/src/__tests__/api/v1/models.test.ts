/**
 * Unit tests for GET /api/v1/models
 *
 * Strategy: mock out all Next.js / pi-sdk / session dependencies so the
 * route handler can be imported and exercised in pure Jest (no running
 * Next.js server required).
 */

// ─── polyfills ───────────────────────────────────────────────────────────────
if (typeof global.Request === 'undefined') {
  global.Request = class Request {} as any;
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {} as any;
}

// ─── mocks ───────────────────────────────────────────────────────────────────

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      body,
    })),
  },
}));

// Mock next/headers
const mockCookiesGet = jest.fn();
jest.mock('next/headers', () => ({
  cookies: () => ({ get: mockCookiesGet }),
}));

// Mock session verifier
const mockVerifySessionToken = jest.fn();
jest.mock('@/lib/session', () => ({
  verifySessionToken: mockVerifySessionToken,
}));

// Mock metrics middleware — transparent passthrough
jest.mock('@/lib/metrics-middleware', () => ({
  withMetrics: (fn: (...args: any[]) => any) => fn,
}));

// Mock provider factory
const mockGetAvailableProviders = jest.fn();
const mockGetPrimaryProviderName = jest.fn();
jest.mock('@pi-merchant/pi-sdk', () => ({
  getProviderFactory: () => ({
    getAvailableProviders: mockGetAvailableProviders,
    getPrimaryProviderName: mockGetPrimaryProviderName,
  }),
}));

// ─── subject ─────────────────────────────────────────────────────────────────

// We import AFTER mocks are set up
// eslint-disable-next-line @typescript-eslint/no-var-requires
let GET: (req?: any) => Promise<any>;

beforeAll(async () => {
  // Dynamic import to ensure mocks are applied first
  const mod = await import('../../../app/api/v1/models/route');
  GET = mod.GET!;
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function authAsUser() {
  mockCookiesGet.mockReturnValue({ value: 'valid-token' });
  mockVerifySessionToken.mockReturnValue('pi-user-uid-123');
}

function noAuth() {
  mockCookiesGet.mockReturnValue(undefined);
  mockVerifySessionToken.mockReturnValue(null);
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('GET /api/v1/models', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: openai available
    process.env.OPENAI_API_KEY = 'sk-test';
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OLLAMA_API_BASE;
    delete process.env.OLLAMA_BASE_URL;

    mockGetAvailableProviders.mockReturnValue([{ name: 'openai' }]);
    mockGetPrimaryProviderName.mockReturnValue('openai');
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  // ── authentication ────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when no cookie is present', async () => {
      noAuth();
      const res = await GET();
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('returns 401 when token verification fails', async () => {
      mockCookiesGet.mockReturnValue({ value: 'bad-token' });
      mockVerifySessionToken.mockReturnValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('returns 200 for a valid authenticated request', async () => {
      authAsUser();
      const res = await GET();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── successful response shape ─────────────────────────────────────────────

  describe('Response shape', () => {
    beforeEach(() => authAsUser());

    it('returns a models array', async () => {
      const res = await GET();
      expect(Array.isArray(res.body.data.models)).toBe(true);
    });

    it('returns totalModels count matching catalog size', async () => {
      const res = await GET();
      expect(typeof res.body.data.total).toBe('number');
      expect(res.body.data.total).toBeGreaterThan(0);
    });

    it('returns primaryProvider from the factory', async () => {
      const res = await GET();
      expect(res.body.data.primaryProvider).toBe('openai');
    });

    it('returns availableProviders array from the factory', async () => {
      const res = await GET();
      expect(res.body.data.availableProviders).toEqual(['openai']);
    });

    it('includes availableCount field', async () => {
      const res = await GET();
      expect(typeof res.body.data.availableCount).toBe('number');
    });

    it('each model has required fields (id, provider, name, capabilities)', async () => {
      const res = await GET();
      for (const model of res.body.data.models) {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('name');
        expect(Array.isArray(model.capabilities)).toBe(true);
      }
    });
  });

  // ── availability gating ───────────────────────────────────────────────────

  describe('Model availability', () => {
    it('marks OpenAI models as unavailable when OPENAI_API_KEY is not set', async () => {
      authAsUser();
      delete process.env.OPENAI_API_KEY;
      // Factory reports no providers
      mockGetAvailableProviders.mockReturnValue([]);
      mockGetPrimaryProviderName.mockReturnValue(null);

      const res = await GET();
      const openaiModels = res.body.data.models.filter((m: any) => m.provider === 'openai');
      openaiModels.forEach((m: any) => {
        expect(m.available).toBe(false);
      });
    });

    it('marks Anthropic models as available when ANTHROPIC_API_KEY is set and factory confirms it', async () => {
      authAsUser();
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
      mockGetAvailableProviders.mockReturnValue([{ name: 'openai' }, { name: 'anthropic' }]);

      const res = await GET();
      const claudeModel = res.body.data.models.find(
        (m: any) => m.provider === 'anthropic' && m.id.startsWith('claude')
      );
      expect(claudeModel).toBeDefined();
      expect(claudeModel.available).toBe(true);
    });
  });

  // ── error handling ────────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('returns 500 when the factory throws an error', async () => {
      authAsUser();
      mockGetAvailableProviders.mockImplementation(() => {
        throw new Error('Factory exploded');
      });

      const res = await GET();
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Factory exploded');
    });
  });
});
