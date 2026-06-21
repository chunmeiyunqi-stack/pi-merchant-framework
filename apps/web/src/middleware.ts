import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from '@/lib/rate-limit';
// Note: do NOT import '@/lib/metrics' at module top-level — it requires Node built-ins and
// will break when middleware is executed in the Edge runtime. When metrics are available
// we dynamically import them inside the handler and ignore failures.
// Note: do not import runWithTenant here because Next.js Edge runtime does not support Node's AsyncLocalStorage

/**
 * AI 接口速率限制配置
 * - /api/ai/* 和 /api/v1/* → 每分钟 20 次（防止 LLM/图像生成滥用）
 * - 其他 /api/* → 每分钟 60 次（宽松限制）
 */
async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const isAiRoute =
    pathname.startsWith('/api/ai/') ||
    pathname.startsWith('/api/v1/images/') ||
    pathname.startsWith('/api/v1/videos/');

  // Only apply rate limiting to AI-heavy endpoints
  if (!isAiRoute) return null;

  // Allow bypass for load tests coming from k6 — only in non-production environments.
  // Production bypasses must use a secret token to prevent clients from self-exempting.
  if (process.env.NODE_ENV !== 'production') {
    try {
      const bypassHeader = request.headers.get('x-k6-bypass-rate-limit');
      if (String(bypassHeader) === '1') return null;
    } catch (_) {}
  }

  const ip = getClientIp(request as unknown as Request);
  // Use authenticated user ID as part of key if available (cookie-based)
  const userId = request.cookies.get('pi_auth_token')?.value?.slice(0, 16) || 'anon';
  const identifier = `${ip}:${userId}`;

  const result = checkRateLimit({
    identifier,
    windowMs: 60_000, // 1 minute window
    maxRequests: isAiRoute ? 20 : 60,
    prefix: isAiRoute ? 'ai' : 'api',
  });

  const headers = buildRateLimitHeaders(result);

  if (result.limited) {
    // increment rate limit metric for monitoring (dynamically, safe for Edge)
    try {
      const metrics = await import('@/lib/metrics');
      try {
        metrics.rateLimitHitsTotal?.inc({ identifier, endpoint: pathname });
      } catch (_) {}
    } catch (_) {}

    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please wait before sending another AI request.',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Attach rate limit headers to the passing response
  const response = NextResponse.next();
  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Rate limiting for AI API routes ──
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = await applyRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
    return NextResponse.next();
  }

  // ── Authentication guard for protected pages ──
  const token = request.cookies.get('pi_auth_token')?.value;

  // Paths that require authentication
  const protectedPaths = ['/dashboard', '/account', '/billing', '/history', '/image-gen'];

  const isProtectedPath = protectedPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('mode', 'signin');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except _next static assets and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
