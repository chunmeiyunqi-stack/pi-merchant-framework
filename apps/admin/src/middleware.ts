import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('pi_auth_token')?.value;

  const protectedPaths = ['/dashboard', '/memberships', '/orders', '/payments', '/services', '/bookings', '/settings'];
  
  const isProtectedPath = protectedPaths.some((path) => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (isProtectedPath && !token) {
    // According to req: If unauthenticated in /dashboard, /memberships, etc., redirect to /login
    // Assuming the login page is physically at /login in the admin app, or we redirect them to the web app's login.
    // Given standard NextJS architectures, navigating to /login is appropriate.
    // If Admin app doesn't have a /login page natively, standard would rely on Web App, but here we redirect to /login.
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('mode', 'signin');
    return NextResponse.redirect(loginUrl);
  }

  // Prevent redirect to signup if somehow triggered to root mapping
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next(); // Explicit approve
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
