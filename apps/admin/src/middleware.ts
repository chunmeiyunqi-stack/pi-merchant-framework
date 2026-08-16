import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('pi_auth_token')?.value;

  const protectedPaths = [
    '/dashboard',
    '/memberships',
    '/orders',
    '/payments',
    '/services',
    '/bookings',
    '/settings',
    '/members',
    '/merchants',
    '/monitoring',
    '/history',
  ];

  const isProtectedPath = protectedPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('mode', 'signin');
    return NextResponse.redirect(loginUrl);
  }

  // 提取与注入多租户 Merchant Context Header
  const requestHeaders = new Headers(request.headers);
  const cookieMerchantId = request.cookies.get('pi_merchant_id')?.value;
  const envMerchantId =
    process.env.NEXT_PUBLIC_MERCHANT_ID ||
    process.env.NEXT_PUBLIC_DEFAULT_MERCHANT_ID ||
    'merchant-demo-001';

  const tenantMerchantId = cookieMerchantId || envMerchantId;
  requestHeaders.set('x-merchant-id', tenantMerchantId);

  if (request.nextUrl.pathname === '/') {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)', '/api/admin/:path*'],
};
