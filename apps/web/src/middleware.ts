// ================================================================
// PiMerchantFramework — Next.js Edge Middleware
// apps/web/src/middleware.ts
//
// Handles:
//   1. Route protection (redirect to /login on missing token)
//   2. Token forwarding to API routes via X-Pi-Token header
//   3. CORS pre-flight passthrough for local dev
// ================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Configuration ─────────────────────────────────────────────────────────────

/** Routes requiring a valid session token */
const PROTECTED_PREFIXES = [
  '/history',
  '/image-gen',
  '/settings',
  '/profile',
  '/dashboard',
];

/** Routes that always bypass auth (login, register, public API) */
const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/api/auth',
  '/api/public',
];

/** Cookie / localStorage key for the access token */
const TOKEN_COOKIE = 'pi_access_token';

// ── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  if (isStaticAsset(pathname)) return NextResponse.next();

  // Skip explicitly public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Attach token for any server-component fetch within this route
    const response = NextResponse.next();
    response.headers.set('X-Pi-Token', token);
    return response;
  }

  // ── API route: forward token ───────────────────────────────────────────────
  if (pathname.startsWith('/api/') && token) {
    const response = NextResponse.next();
    response.headers.set('X-Pi-Token', token);
    return response;
  }

  return NextResponse.next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    /\.(png|jpe?g|svg|webp|ico|woff2?|ttf|otf|css|js\.map)$/.test(pathname)
  );
}

// ── Matcher: skip known-static paths at the edge layer ────────────────────────
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt).*)',
  ],
};
