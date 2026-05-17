import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Note: do not import runWithTenant here because Next.js Edge runtime does not support Node's AsyncLocalStorage

export function middleware(request: NextRequest) {
  // Check for the presence of the Pi auth token
  const token = request.cookies.get('pi_auth_token')?.value;

  // Paths that require authentication
  const protectedPaths = ['/dashboard', '/account', '/billing'];

  const isProtectedPath = protectedPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );

  // Redirect to login (Sign In) if trying to access a protected route without a token
  const handle = () => {
    if (isProtectedPath && !token) {
      const loginUrl = new URL('/login', request.url);
      // Add mode=signin just as an explicit UX/UI hint if needed by components
      loginUrl.searchParams.set('mode', 'signin');
      return NextResponse.redirect(loginUrl);
    }

    // Ensure the landing page / is ALWAYS accessible to unauthenticated users.
    if (request.nextUrl.pathname === '/') {
      return NextResponse.next();
    }

    return NextResponse.next();
  };

  // Tenant resolution: prefer header 'x-tenant-id', fall back to cookie 'merchant_id', else env default
  const headerTenant = request.headers?.get?.('x-tenant-id');
  const cookieTenant = request.cookies?.get?.('merchant_id')?.value;
  const _tenantId = headerTenant ?? cookieTenant ?? process.env.NEXT_PUBLIC_MERCHANT_ID;

  // Edge middleware cannot rely on AsyncLocalStorage; resolve tenant for routing but do not attempt runtime injection here
  return handle();
}

export const config = {
  // Apply middleware to all routes except api, _next static assets, and favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
