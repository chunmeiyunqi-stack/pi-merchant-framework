if (typeof global.Request === 'undefined') {
  global.Request = class Request {} as any;
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {} as any;
}

// Mock Next.js modules MUST come before imports that use them
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: 'next' })),
    redirect: jest.fn((url) => ({ type: 'redirect', url: url.href || url.toString() })),
  },
}));

import { middleware } from '../middleware';
import { NextResponse } from 'next/server';

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and routing', () => {
    it('redirects unauthenticated users from protected paths to login', () => {
      const mockRequest = {
        cookies: {
          get: jest.fn(() => undefined), // No token
        },
        nextUrl: {
          pathname: '/dashboard',
        },
        url: 'https://example.com/dashboard',
      } as unknown as any;

      middleware(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('allows authenticated users to access protected paths', () => {
      const mockRequest = {
        cookies: {
          get: jest.fn(() => ({ value: 'valid-token' })),
        },
        nextUrl: {
          pathname: '/dashboard',
        },
        url: 'https://example.com/dashboard',
      } as unknown as any;

      middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows unauthenticated users to access the landing page', () => {
      const mockRequest = {
        cookies: {
          get: jest.fn(() => undefined),
        },
        nextUrl: {
          pathname: '/',
        },
        url: 'https://example.com/',
      } as unknown as any;

      middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows authenticated users to access public pages', () => {
      const mockRequest = {
        cookies: {
          get: jest.fn(() => ({ value: 'valid-token' })),
        },
        nextUrl: {
          pathname: '/about',
        },
        url: 'https://example.com/about',
      } as unknown as any;

      middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Path matching', () => {
    const protectedPaths = ['/dashboard', '/account', '/billing'];

    protectedPaths.forEach((path) => {
      it(`recognizes ${path} as protected`, () => {
        const mockRequest = {
          cookies: {
            get: jest.fn(() => undefined),
          },
          nextUrl: {
            pathname: path,
          },
          url: 'https://example.com' + path,
        } as unknown as any;

        middleware(mockRequest);

        expect(NextResponse.redirect).toHaveBeenCalled();
      });
    });

    const publicPaths = ['/about', '/contact', '/pricing'];

    publicPaths.forEach((path) => {
      it(`allows access to public path ${path}`, () => {
        const mockRequest = {
          cookies: {
            get: jest.fn(() => undefined),
          },
          nextUrl: {
            pathname: path,
          },
          url: 'https://example.com' + path,
        } as unknown as any;

        middleware(mockRequest);

        expect(NextResponse.next).toHaveBeenCalled();
      });
    });
  });
});
