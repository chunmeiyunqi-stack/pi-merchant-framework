type RateEntry = { count: number; resetAt: number };

export class RateLimiter {
  private store: Map<string, RateEntry> = new Map();

  async check(key: string, max: number, windowMs: number) {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || entry.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return { limited: false, remaining: max - 1, retryAfter: 0, resetAt: now + windowMs };
    }
    entry.count += 1;
    const limited = entry.count > max;
    const remaining = limited ? 0 : Math.max(0, max - entry.count);
    return {
      limited,
      remaining,
      retryAfter: Math.max(0, entry.resetAt - now),
      resetAt: entry.resetAt,
    };
  }

  async checkByIp(ip: string, max: number, windowMs: number) {
    return this.check(`ip:${ip}`, max, windowMs);
  }

  async checkByUserId(userId: string, max: number, windowMs: number) {
    return this.check(`user:${userId}`, max, windowMs);
  }

  async checkByEndpoint(endpoint: string, max: number, windowMs: number) {
    return this.check(`ep:${endpoint}`, max, windowMs);
  }

  cleanup() {
    const now = Date.now();
    for (const [k, v] of this.store.entries()) {
      if (v.resetAt <= now) this.store.delete(k);
    }
  }
}

export function getClientIp(req: any) {
  try {
    const xff =
      req.headers?.['x-forwarded-for'] ||
      req.headers?.['X-Forwarded-For'] ||
      req.headers?.['x-forwarded-for'];
    if (typeof xff === 'string') return xff.split(',')[0].trim();
    const xr = req.headers?.['x-real-ip'] || req.headers?.['X-Real-IP'];
    if (xr) return String(xr);
    if (req.socket?.remoteAddress) {
      const addr = req.socket.remoteAddress as string;
      if (addr.startsWith('::ffff:')) return addr.split('::ffff:')[1];
      return addr;
    }
    return '127.0.0.1';
  } catch (_) {
    return '127.0.0.1';
  }
}

export function buildRateLimitHeaders(res: any) {
  return {
    'X-RateLimit-Limit': String(res.max ?? ''),
    'X-RateLimit-Remaining': String(res.remaining ?? ''),
    'X-RateLimit-Reset': String(res.resetAt ?? ''),
  };
}

export default { RateLimiter, getClientIp };
