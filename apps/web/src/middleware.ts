import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from '@/lib/rate-limit';
// Note: do not import runWithTenant here because Next.js Edge runtime does not support Node's AsyncLocalStorage

/**
 * AI 接口速率限制配置
 * - /api/ai/* 和 /api/v1/* → 每分钟 20 次（防止 LLM/图像生成滥用）
 * - 其他 /api/* → 每分钟 60 次（宽松限制）
 */
function applyRateLimit(
  request: NextRequest
): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const isAiRoute =
    pathname.startsWith('/api/ai/') ||
    pathname.startsWith('/api/v1/images/') ||
    pathname.startsWith('/api/v1/videos/');

  // Only apply rate limiting to AI-heavy endpoints
  if (!isAiRoute) return null;

  const ip = getClientIp(request as unknown as Request);
  // Use authenticated user ID as part of key if available (cookie-based)
  const userId = request.cookies.get('pi_auth_token')?.value?.slice(0, 16) || 'anon';
  const identifier = `${ip}:${userId}`;

  const result = checkRateLimit({
    identifier,
    windowMs: 60_000,       // 1 minute window
    maxRequests: isAiRoute ? 20 : 60,
    prefix: isAiRoute ? 'ai' : 'api',
  });

  const headers = buildRateLimitHeaders(result);

  if (result.limited) {
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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Rate limiting for AI API routes ──
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = applyRateLimit(request);
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

  // Tenant resolution: prefer header 'x-tenant-id', fall back to cookie 'merchant_id', else env default
  const headerTenant = request.headers?.get?.('x-tenant-id');
  const cookieTenant = request.cookies?.get?.('merchant_id')?.value;
  const _tenantId = headerTenant ?? cookieTenant ?? process.env.NEXT_PUBLIC_MERCHANT_ID;

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except _next static assets and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
