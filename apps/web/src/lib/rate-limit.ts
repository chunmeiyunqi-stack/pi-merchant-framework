// In-memory rate limiter for development (single-instance).
// For production use Redis/Upstash or a distributed rate limiter.

// Public interfaces
export interface RateLimitOptions {
  identifier: string;
  windowMs?: number; // default 60_000 (1 minute)
  maxRequests?: number; // default 20
  prefix?: string;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: number; // unix ms
  used: number;
  limit: number;
}

// Internal entry shape
interface StoreEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, StoreEntry>();

// Periodic cleanup to avoid unbounded memory growth
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 10 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { identifier, windowMs = 60_000, maxRequests = 20, prefix = 'rl' } = options;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    entry = { count: 1, windowStart: now };
    store.set(key, entry);
    return {
      limited: false,
      remaining: Math.max(0, maxRequests - 1),
      resetAt: now + windowMs,
      used: 1,
      limit: maxRequests,
    };
  }

  entry.count += 1;
  store.set(key, entry);

  const used = entry.count;
  const limited = used > maxRequests;
  const remaining = Math.max(0, maxRequests - used);
  const resetAt = entry.windowStart + windowMs;

  return { limited, remaining, resetAt, used, limit: maxRequests };
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    'X-RateLimit-Used': String(result.used),
  };
}

export function getClientIp(request: Request | { headers?: any }): string {
  try {
    const headers = (request as any).headers;
    const cf = headers?.get?.('cf-connecting-ip') || headers?.get?.('x-real-ip');
    if (cf) return String(cf).split(',')[0].trim();
    const xff = headers?.get?.('x-forwarded-for') || headers?.get?.('X-Forwarded-For');
    if (xff) return String(xff).split(',')[0].trim();
  } catch (e) {
    // ignore and fallback
  }
  return '127.0.0.1';
}
