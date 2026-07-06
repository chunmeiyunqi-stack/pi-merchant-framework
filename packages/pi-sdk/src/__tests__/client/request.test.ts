import { PiRequestClient } from '../../client/request';
import { ApiError } from '../../types/api';

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('PiRequestClient', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  let client: PiRequestClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new PiRequestClient();
  });

  describe('Standard Error Format (ApiError)', () => {
    it('sets code and retryable status correctly for 500 server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Something went wrong' }),
      } as Response);

      await expect(client.request({ url: '/api/test', retries: 0 })).rejects.toThrow(ApiError);

      try {
        await client.request({ url: '/api/test', retries: 0 });
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(500);
        expect(err.code).toBe('SERVER_ERROR');
        expect(err.retryable).toBe(true);
      }
    });

    it('sets code and retryable status correctly for 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Token invalid' }),
      } as Response);

      try {
        await client.request({ url: '/api/test', retries: 0 });
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(401);
        expect(err.code).toBe('UNAUTHORIZED');
        expect(err.retryable).toBe(false);
      }
    });

    it('extracts custom code from response body details if present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ code: 'CUSTOM_INVALID_PAYLOAD', message: 'Invalid payload detail' }),
      } as Response);

      try {
        await client.request({ url: '/api/test', retries: 0 });
      } catch (err: any) {
        expect(err.code).toBe('CUSTOM_INVALID_PAYLOAD');
        expect(err.retryable).toBe(false);
      }
    });
  });

  describe('Automatic Provider Injection', () => {
    it('injects Authorization and X-License-Id headers when providers are set', async () => {
      client.setTokenProvider(() => 'mock-auth-token-xyz');
      client.setLicenseIdProvider(() => 'mock-license-id-123');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response);

      await client.request({ url: '/api/test' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCallArgs = mockFetch.mock.calls[0];
      const headers = fetchCallArgs[1]?.headers as any;

      expect(headers['Authorization']).toBe('Bearer mock-auth-token-xyz');
      expect(headers['X-License-Id']).toBe('mock-license-id-123');
    });

    it('does not overwrite explicitly supplied headers', async () => {
      client.setTokenProvider(() => 'should-not-use-this');
      client.setLicenseIdProvider(() => 'should-not-use-this-either');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response);

      await client.request({
        url: '/api/test',
        headers: {
          Authorization: 'Bearer user-specified-token',
          'X-License-Id': 'user-specified-license',
        },
      });

      const headers = mockFetch.mock.calls[0][1]?.headers as any;
      expect(headers['Authorization']).toBe('Bearer user-specified-token');
      expect(headers['X-License-Id']).toBe('user-specified-license');
    });
  });

  describe('Automatic Token Refresh & Retry on 401', () => {
    it('retries request once if 401 is returned and handleTokenRefresh returns new token', async () => {
      client.setTokenProvider(() => 'expired-token');

      const newFreshToken = 'fresh-new-token';
      const refreshMock = jest.fn().mockResolvedValue(newFreshToken);
      client.setTokenRefreshHandler(refreshMock);

      // First fetch call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Expired token' }),
      } as Response);

      // Second fetch call (retry) returns 200 success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, count: 42 }),
      } as Response);

      const result = await client.request({ url: '/api/protected', retries: 0 });

      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify second call got active Bearer header set with the new token
      const secondCallHeaders = mockFetch.mock.calls[1][1]?.headers as any;
      expect(secondCallHeaders['Authorization']).toBe(`Bearer ${newFreshToken}`);

      expect(result.data).toEqual({ success: true, count: 42 });
    });

    it('bubbles up 401 if refresh handler is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      await expect(client.request({ url: '/api/protected', retries: 0 })).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('bubbles up 401 if refresh handler fails or returns null', async () => {
      client.setTokenProvider(() => 'expired-token');
      client.setTokenRefreshHandler(async () => null);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Token expired' }),
      } as Response);

      await expect(client.request({ url: '/api/protected', retries: 0 })).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
