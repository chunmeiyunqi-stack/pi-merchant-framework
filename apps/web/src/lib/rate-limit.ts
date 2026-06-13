// Simple in-memory rate limiter for development and single-instance use.
// Not suitable for multi-instance / production. Persisted in-memory Map.

export interface RateLimitOptions {
  identifier: string;
  windowMs: number;
  maxRequests: number;
  prefix?: string;
}

export interface RateLimitResult {
  limited: boolean;
  resetAt: number; // epoch ms when window resets
  remaining: number;
  limit: number;
}

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  const { identifier, windowMs, maxRequests, prefix = 'rl' } = opts;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();

  const existing = store.get(key);
  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      limited: 1 > maxRequests,
      resetAt,
      remaining: Math.max(0, maxRequests - 1),
      limit: maxRequests,
    };
  }

  existing.count += 1;
  store.set(key, existing);

  const limited = existing.count > maxRequests;
  return {
    limited,
    resetAt: existing.resetAt,
    remaining: Math.max(0, maxRequests - existing.count),
    limit: maxRequests,
  };
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    // reset in unix seconds
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

export function getClientIp(req: Request | { headers?: any } ): string {
  try {
    const headers = (req as any).headers;
    const xff = headers?.get?.('x-forwarded-for') || headers?.get?.('x-real-ip') || headers?.get?.('X-Forwarded-For');
    if (xff) return String(xff).split(',')[0].trim();
  } catch (e) {
    // ignore
  }
  return '127.0.0.1';
}
// ============================================================
// Pioneer AI Framework — 速率限制工具
//
// 基于内存的滑动窗口速率限制器，兼容 Next.js Edge Runtime。
// 每个唯一标识符（IP 或用户 ID）在时间窗口内最多允许 N 次请求。
//
// 注意：
//   - 仅适用于单实例部署；分布式环境需换用 Redis（如 Upstash Rate Limit）
//   - 内存存储不持久化，服务重启后计数器清零
// ============================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// 全局内存存储
const store = new Map<string, RateLimitEntry>();

// 自动清理过期条目（每 5 分钟一次）
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      // Remove entries older than 2x the max window size (10 minutes)
      if (now - entry.windowStart > 10 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

export interface RateLimitOptions {
  /** 唯一标识符（IP 地址或用户 ID） */
  identifier: string;
  /** 时间窗口（毫秒），默认 60,000ms (1 分钟) */
  windowMs?: number;
  /** 窗口内最大请求数，默认 20 */
  maxRequests?: number;
  /** 可选前缀，区分不同的限制规则 */
  prefix?: string;
}

export interface RateLimitResult {
  /** 是否被限速（true = 被拒绝） */
  limited: boolean;
  /** 当前窗口剩余请求数 */
  remaining: number;
  /** 限速重置时间（Unix 毫秒时间戳） */
  resetAt: number;
  /** 当前窗口已使用请求数 */
  used: number;
  /** 最大允许请求数 */
  limit: number;
}

/**
 * 检查并更新速率限制计数器
 *
 * @param options - 速率限制配置
 * @returns 限制结果（含 remaining / resetAt 等元数据）
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const {
    identifier,
    windowMs = 60_000,
    maxRequests = 20,
    prefix = 'rl',
  } = options;

  const key = `${prefix}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  // 初始化或窗口已过期 → 重置计数
  if (!entry || now - entry.windowStart >= windowMs) {
    entry = { count: 1, windowStart: now };
    store.set(key, entry);

    return {
      limited: false,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
      used: 1,
      limit: maxRequests,
    };
  }

  // 窗口内递增计数
  entry.count += 1;
  store.set(key, entry);

  const resetAt = entry.windowStart + windowMs;
  const used = entry.count;
  const remaining = Math.max(0, maxRequests - used);
  const limited = used > maxRequests;

  return { limited, remaining, resetAt, used, limit: maxRequests };
}

/**
 * 构建速率限制响应头
 */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    'X-RateLimit-Used': String(result.used),
  };
}

/**
 * 从 Next.js 请求头中提取客户端 IP
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
