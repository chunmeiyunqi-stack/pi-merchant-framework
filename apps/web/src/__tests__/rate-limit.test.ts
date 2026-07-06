/**
 * Unit tests for apps/web/src/lib/rate-limit.ts
 *
 * Tests cover:
 *  - Core sliding-window counting logic
 *  - Window reset behaviour
 *  - buildRateLimitHeaders helper
 *  - getClientIp header extraction
 *  - Edge cases: concurrent keys, exact-limit boundary
 */

import {
  checkRateLimit,
  buildRateLimitHeaders,
  getClientIp,
  type RateLimitResult,
} from '../lib/rate-limit';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Advance jest's fake timer by `ms` milliseconds. */
function advanceTime(ms: number) {
  jest.advanceTimersByTime(ms);
}

// ─── setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Use fake timers so we can control Date.now() deterministically
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  // Clear the in-memory store between tests by resetting module state
  jest.resetModules();
});

// ─── checkRateLimit ─────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  describe('first request in a new window', () => {
    it('returns limited=false on first call', () => {
      const result = checkRateLimit({ identifier: 'user-a', maxRequests: 5 });
      expect(result.limited).toBe(false);
    });

    it('has used=1 and remaining=maxRequests-1 on first call', () => {
      const result = checkRateLimit({ identifier: 'user-b', maxRequests: 10 });
      expect(result.used).toBe(1);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
    });

    it('sets resetAt roughly windowMs in the future', () => {
      const before = Date.now();
      const windowMs = 30_000;
      const result = checkRateLimit({ identifier: 'user-c', windowMs, maxRequests: 5 });
      expect(result.resetAt).toBeGreaterThanOrEqual(before + windowMs);
    });
  });

  describe('accumulation within a window', () => {
    it('increments count on each call', () => {
      const opts = { identifier: 'user-inc', maxRequests: 10 };
      checkRateLimit(opts); // 1
      checkRateLimit(opts); // 2
      const result = checkRateLimit(opts); // 3
      expect(result.used).toBe(3);
      expect(result.remaining).toBe(7);
    });

    it('is not limited until maxRequests is exceeded', () => {
      const opts = { identifier: 'user-boundary', maxRequests: 3 };
      const r1 = checkRateLimit(opts); // used=1
      const r2 = checkRateLimit(opts); // used=2
      const r3 = checkRateLimit(opts); // used=3 — exactly at limit, NOT yet limited
      const r4 = checkRateLimit(opts); // used=4 — over limit

      expect(r1.limited).toBe(false);
      expect(r2.limited).toBe(false);
      expect(r3.limited).toBe(false);
      expect(r4.limited).toBe(true);
    });

    it('remaining floors at 0', () => {
      const opts = { identifier: 'user-floor', maxRequests: 2 };
      checkRateLimit(opts);
      checkRateLimit(opts);
      const r = checkRateLimit(opts); // over limit
      expect(r.remaining).toBe(0);
    });
  });

  describe('window reset', () => {
    it('resets counter after the window expires', () => {
      const windowMs = 60_000;
      const opts = { identifier: 'user-reset', maxRequests: 3, windowMs };

      // Fill up the window
      checkRateLimit(opts);
      checkRateLimit(opts);
      checkRateLimit(opts);
      const overLimit = checkRateLimit(opts);
      expect(overLimit.limited).toBe(true);

      // Advance past the window
      advanceTime(windowMs + 1);

      // Next call should reset
      const afterReset = checkRateLimit(opts);
      expect(afterReset.limited).toBe(false);
      expect(afterReset.used).toBe(1);
    });
  });

  describe('prefix isolation', () => {
    it('treats the same identifier with different prefixes as separate keys', () => {
      const identifier = 'shared-id';
      for (let i = 0; i < 3; i++) checkRateLimit({ identifier, maxRequests: 3, prefix: 'api' });
      // api prefix is now at limit; ai prefix should still be clean
      const result = checkRateLimit({ identifier, maxRequests: 3, prefix: 'ai' });
      expect(result.limited).toBe(false);
      expect(result.used).toBe(1);
    });
  });

  describe('default option values', () => {
    it('defaults to windowMs=60000 and maxRequests=20', () => {
      const result = checkRateLimit({ identifier: 'defaults-user' });
      expect(result.limit).toBe(20);
    });
  });

  describe('multiple independent identifiers', () => {
    it('does not cross-contaminate counters between different users', () => {
      const fill = (id: string) => {
        for (let i = 0; i < 5; i++) checkRateLimit({ identifier: id, maxRequests: 3 });
      };

      fill('user-x'); // user-x over limit
      const result = checkRateLimit({ identifier: 'user-y', maxRequests: 3 }); // first call for user-y
      expect(result.limited).toBe(false);
      expect(result.used).toBe(1);
    });
  });
});

// ─── buildRateLimitHeaders ───────────────────────────────────────────────────

describe('buildRateLimitHeaders', () => {
  const mockResult: RateLimitResult = {
    limited: false,
    remaining: 15,
    resetAt: 1_700_000_060_000, // unix ms
    used: 5,
    limit: 20,
  };

  it('returns all four standard headers', () => {
    const headers = buildRateLimitHeaders(mockResult);
    expect(headers).toHaveProperty('X-RateLimit-Limit');
    expect(headers).toHaveProperty('X-RateLimit-Remaining');
    expect(headers).toHaveProperty('X-RateLimit-Reset');
    expect(headers).toHaveProperty('X-RateLimit-Used');
  });

  it('X-RateLimit-Limit equals the configured limit', () => {
    const headers = buildRateLimitHeaders(mockResult);
    expect(headers['X-RateLimit-Limit']).toBe('20');
  });

  it('X-RateLimit-Remaining equals remaining', () => {
    const headers = buildRateLimitHeaders(mockResult);
    expect(headers['X-RateLimit-Remaining']).toBe('15');
  });

  it('X-RateLimit-Reset is the ceiling of resetAt / 1000 (unix seconds)', () => {
    const headers = buildRateLimitHeaders(mockResult);
    const expected = String(Math.ceil(mockResult.resetAt / 1000));
    expect(headers['X-RateLimit-Reset']).toBe(expected);
  });

  it('X-RateLimit-Used equals used count', () => {
    const headers = buildRateLimitHeaders(mockResult);
    expect(headers['X-RateLimit-Used']).toBe('5');
  });
});

// ─── getClientIp ─────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  function makeRequest(headers: Record<string, string>) {
    return {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] ?? null,
      },
    } as unknown as Request;
  }

  it('prefers cf-connecting-ip over x-forwarded-for', () => {
    const req = makeRequest({
      'cf-connecting-ip': '1.2.3.4',
      'x-forwarded-for': '9.9.9.9',
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip when cf-connecting-ip is absent', () => {
    const req = makeRequest({ 'x-real-ip': '5.6.7.8' });
    expect(getClientIp(req)).toBe('5.6.7.8');
  });

  it('falls back to x-forwarded-for when cf headers are absent', () => {
    const req = makeRequest({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2' });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('trims whitespace from x-forwarded-for entries', () => {
    const req = makeRequest({ 'x-forwarded-for': '  192.168.1.100  , proxy.ip' });
    expect(getClientIp(req)).toBe('192.168.1.100');
  });

  it('returns 127.0.0.1 when no IP headers are present', () => {
    const req = makeRequest({});
    expect(getClientIp(req)).toBe('127.0.0.1');
  });

  it('returns 127.0.0.1 when called with an empty object', () => {
    expect(getClientIp({})).toBe('127.0.0.1');
  });

  it('handles record-style headers (plain object without .get())', () => {
    const req = {
      headers: { 'x-forwarded-for': '203.0.113.42' } as Record<string, string>,
    };
    expect(getClientIp(req)).toBe('203.0.113.42');
  });
});
