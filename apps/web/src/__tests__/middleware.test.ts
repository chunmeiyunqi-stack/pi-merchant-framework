import { middleware } from '../middleware';

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: 'next' })),
    redirect: jest.fn((url) => ({ type: 'redirect', url: url.href || url.toString() })),
  },
}));

const mockNextResponse = require('next/server').NextResponse;

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
      };

      middleware(mockRequest as any);

      expect(mockNextResponse.redirect).toHaveBeenCalled();
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
      };

      middleware(mockRequest as any);

      expect(mockNextResponse.next).toHaveBeenCalled();
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
      };

      middleware(mockRequest as any);

      expect(mockNextResponse.next).toHaveBeenCalled();
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
      };

      middleware(mockRequest as any);

      expect(mockNextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Path matching', () => {
    const protectedPaths = ['/dashboard', '/account', '/billing'];

    protectedPaths.forEach(path => {
      it(`recognizes ${path} as protected`, () => {
        const mockRequest = {
          cookies: {
            get: jest.fn(() => undefined),
          },
          nextUrl: {
            pathname: path,
          },
          url: 'https://example.com' + path,
        };

        middleware(mockRequest as any);

        expect(mockNextResponse.redirect).toHaveBeenCalled();
      });
    });

    const publicPaths = ['/about', '/contact', '/pricing'];

    publicPaths.forEach(path => {
      it(`allows access to public path ${path}`, () => {
        const mockRequest = {
          cookies: {
            get: jest.fn(() => undefined),
          },
          nextUrl: {
            pathname: path,
          },
          url: 'https://example.com' + path,
        };

        middleware(mockRequest as any);

        expect(mockNextResponse.next).toHaveBeenCalled();
      });
    });
  });
});