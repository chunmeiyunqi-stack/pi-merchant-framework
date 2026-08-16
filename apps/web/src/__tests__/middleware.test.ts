if (typeof global.Request === 'undefined') {
  global.Request = class Request {} as any;
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {} as any;
}

// Mock Next.js modules MUST come before imports that use them
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: 'next', headers: { set: jest.fn() } })),
    redirect: jest.fn((url) => ({
      type: 'redirect',
      url: url.href || url.toString(),
      headers: { set: jest.fn() },
    })),
  },
}));

import { middleware } from '../middleware';
import { NextResponse } from 'next/server';

function createMockRequest(pathname: string, hasToken = false) {
  const headersMap = new Map<string, string>();
  return {
    cookies: {
      get: jest.fn((name: string) =>
        name === 'pi_auth_token' && hasToken ? { value: 'valid-token' } : undefined
      ),
    },
    headers: {
      get: jest.fn((key: string) => headersMap.get(key)),
      set: jest.fn((key: string, val: string) => headersMap.set(key, val)),
    },
    nextUrl: { pathname },
    url: `https://example.com${pathname}`,
  } as unknown as any;
}

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and routing', () => {
    it('redirects unauthenticated users from protected paths to login', () => {
      const mockRequest = createMockRequest('/dashboard', false);
      middleware(mockRequest);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('allows authenticated users to access protected paths', () => {
      const mockRequest = createMockRequest('/dashboard', true);
      middleware(mockRequest);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows unauthenticated users to access the landing page', () => {
      const mockRequest = createMockRequest('/', false);
      middleware(mockRequest);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows authenticated users to access public pages', () => {
      const mockRequest = createMockRequest('/about', true);
      middleware(mockRequest);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Path matching', () => {
    const protectedPaths = ['/dashboard', '/history', '/settings'];

    protectedPaths.forEach((path) => {
      it(`recognizes ${path} as protected`, () => {
        const mockRequest = createMockRequest(path, false);
        middleware(mockRequest);
        expect(NextResponse.redirect).toHaveBeenCalled();
      });
    });

    const publicPaths = ['/login', '/register', '/services'];

    publicPaths.forEach((path) => {
      it(`allows access to public path ${path}`, () => {
        const mockRequest = createMockRequest(path, false);
        middleware(mockRequest);
        expect(NextResponse.next).toHaveBeenCalled();
      });
    });
  });
});
