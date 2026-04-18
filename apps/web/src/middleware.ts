import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the presence of the Pi auth token
  const token = request.cookies.get('pi_auth_token')?.value;

  // Paths that require authentication
  const protectedPaths = ['/dashboard', '/account', '/billing'];
  
  const isProtectedPath = protectedPaths.some((path) => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );

  // Redirect to login (Sign In) if trying to access a protected route without a token
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    // Add mode=signin just as an explicit UX/UI hint if needed by components
    loginUrl.searchParams.set('mode', 'signin');
    return NextResponse.redirect(loginUrl);
  }

  // Ensure the landing page / is ALWAYS accessible to unauthenticated users.
  // Next.js allows it unless explicitly intercepted, but this is added for clarity 
  // to satisfy strict requirements forbidding auto-redirects to signup on /.
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except api, _next static assets, and favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
