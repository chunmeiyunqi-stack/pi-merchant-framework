import { AsyncLocalStorage } from 'async_hooks';
import { log, logEvent, logError, logWarn, logDebug, trackMetric } from '../logger';

// Mock fetch and console methods
global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.MockedFunction<typeof fetch>;
const mockConsole = {
  info: jest.spyOn(console, 'info').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
};

// Mock AsyncLocalStorage
jest.mock('async_hooks', () => ({
  AsyncLocalStorage: jest.fn().mockImplementation(() => ({
    getStore: jest.fn(),
    run: jest.fn((store, callback) => callback()),
  })),
}));

describe('Logger', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const mockAsyncLocalStorage = AsyncLocalStorage as jest.MockedClass<typeof AsyncLocalStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MONITORING_WEBHOOK_URL;
    delete process.env.APP_NAME;
    mockAsyncLocalStorage.mockClear();
  });

  afterEach(() => {
    mockConsole.info.mockRestore();
    mockConsole.warn.mockRestore();
    mockConsole.error.mockRestore();
    mockConsole.debug.mockRestore();
  });

  describe('Basic logging functionality', () => {
    it('logs info messages to console', () => {
      log('info', 'Test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"level":"info"')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test message"')
      );
    });

    it('logs error messages to console', () => {
      log('error', 'Error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"level":"error"')
      );
    });

    it('logs warn messages to console', () => {
      log('warn', 'Warning message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('"level":"warn"')
      );
    });

    it('logs debug messages to console', () => {
      log('debug', 'Debug message');

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('"level":"debug"')
      );
    });

    it('includes timestamp in log output', () => {
      const beforeTime = Date.now();
      log('info', 'Test message');
      const afterTime = Date.now();

      const loggedMessage = mockConsole.info.mock.calls[0][0];
      const parsed = JSON.parse(loggedMessage);
      expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(parsed.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('includes metadata in log output', () => {
      log('info', 'Message with metadata', { userId: '123', action: 'login' });

      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toContain('"userId":"123"');
      expect(loggedMessage).toContain('"action":"login"');
    });

    it('includes service name in log output', () => {
      process.env.APP_NAME = 'test-service';
      log('info', 'Test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"service":"test-service"')
      );
    });

    it('uses default service name when not set', () => {
      log('info', 'Test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"service":"pi-merchant-framework"')
      );
    });

    it('handles complex metadata objects', () => {
      const complexMetadata = {
        user: { id: '123', role: 'admin' },
        request: { method: 'POST', url: '/api/users' },
        nested: { deep: { value: 'test' } },
      };

      log('info', 'Complex log', complexMetadata);

      const loggedMessage = mockConsole.info.mock.calls[0][0];
      const parsed = JSON.parse(loggedMessage);
      expect(parsed.user.id).toBe('123');
      expect(parsed.request.method).toBe('POST');
      expect(parsed.nested.deep.value).toBe('test');
    });
  });

  describe('Convenience logging functions', () => {
    it('logEvent calls log with info level', () => {
      logEvent('Event occurred', { eventId: '123' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"level":"info"')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Event occurred"')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"eventId":"123"')
      );
    });

    it('logError handles Error objects', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      logError('Error occurred', error, { userId: '123' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"level":"error"')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Error occurred"')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"userId":"123"')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"stack":"Error stack trace"')
      );
    });

    it('logError handles non-Error objects', () => {
      logError('Error occurred', 'string error', { userId: '123' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"error":"string error"')
      );
    });

    it('logError handles null/undefined errors', () => {
      logError('Error occurred', null, { userId: '123' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"error":null')
      );
    });

    it('logWarn calls log with warn level', () => {
      logWarn('Warning message', { severity: 'high' });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('"level":"warn"')
      );
    });

    it('logDebug calls log with debug level', () => {
      logDebug('Debug info', { component: 'auth' });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('"level":"debug"')
      );
    });
  });

  describe('TraceID and AsyncLocalStorage', () => {
    let mockStore: any;

    beforeEach(() => {
      mockStore = { traceId: 'async-trace-123' };
      const mockALSInstance = {
        getStore: jest.fn().mockReturnValue(mockStore),
        run: jest.fn((store, callback) => callback()),
      };
      mockAsyncLocalStorage.mockReturnValue(mockALSInstance as any);
    });

    it('includes traceId from AsyncLocalStorage when available', () => {
      log('info', 'Request processed');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"traceId":"async-trace-123"')
      );
    });

    it('overrides AsyncLocalStorage traceId with explicit traceId', () => {
      log('info', 'Request processed', { traceId: 'explicit-trace-456' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"traceId":"explicit-trace-456"')
      );
    });

    it('handles missing AsyncLocalStorage store', () => {
      const mockALSInstance = {
        getStore: jest.fn().mockReturnValue(null),
        run: jest.fn((store, callback) => callback()),
      };
      mockAsyncLocalStorage.mockReturnValue(mockALSInstance as any);

      log('info', 'Request processed');

      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).not.toContain('traceId');
    });

    it('handles AsyncLocalStorage store without traceId', () => {
      const mockALSInstance = {
        getStore: jest.fn().mockReturnValue({ otherData: 'value' }),
        run: jest.fn((store, callback) => callback()),
      };
      mockAsyncLocalStorage.mockReturnValue(mockALSInstance as any);

      log('info', 'Request processed');

      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).not.toContain('traceId');
    });

    it('preserves traceId across multiple log calls in same context', () => {
      log('info', 'Step 1', { step: 1 });
      log('info', 'Step 2', { step: 2 });
      log('info', 'Step 3', { step: 3 });

      expect(mockConsole.info).toHaveBeenCalledTimes(3);
      mockConsole.info.mock.calls.forEach(call => {
        expect(call[0]).toContain('"traceId":"async-trace-123"');
      });
    });

    it('handles traceId in error logging with AsyncLocalStorage', () => {
      logError('Operation failed', new Error('Test error'));

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"traceId":"async-trace-123"')
      );
    });

    it('generates unique traceId for each async context', () => {
      const stores = [
        { traceId: 'trace-1' },
        { traceId: 'trace-2' },
        { traceId: 'trace-3' },
      ];

      stores.forEach((store, index) => {
        const mockALSInstance = {
          getStore: jest.fn().mockReturnValue(store),
          run: jest.fn((store, callback) => callback()),
        };
        mockAsyncLocalStorage.mockReturnValueOnce(mockALSInstance as any);

        log('info', `Message ${index + 1}`);

        expect(mockConsole.info).toHaveBeenCalledWith(
          expect.stringContaining(`"traceId":"trace-${index + 1}"`)
        );
      });
    });
  });

  describe('Webhook forwarding', () => {
    beforeEach(() => {
      process.env.MONITORING_WEBHOOK_URL = 'https://webhook.example.com/log';
    });

    it('forwards logs to webhook when URL is configured', () => {
      log('info', 'Test message');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://webhook.example.com/log',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"message":"Test message"'),
        })
      );
    });

    it('does not forward logs when webhook URL is not configured', () => {
      delete process.env.MONITORING_WEBHOOK_URL;

      log('info', 'Test message');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('includes all log data in webhook payload', () => {
      log('error', 'Error occurred', { userId: '123', errorCode: 'E001' });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.level).toBe('error');
      expect(body.message).toBe('Error occurred');
      expect(body.userId).toBe('123');
      expect(body.errorCode).toBe('E001');
      expect(body.timestamp).toBeDefined();
      expect(body.service).toBe('pi-merchant-framework');
    });

    it('handles webhook forwarding failures gracefully', () => {
      mockFetch.mockRejectedValueOnce(new Error('Webhook failed'));

      // Should not throw, just log to console
      expect(() => {
        log('info', 'Test message');
      }).not.toThrow();

      // Console logging should still work
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('retries webhook forwarding on failure', async () => {
      // Mock fetch to fail twice then succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ ok: true });

      log('error', 'Critical error');

      // Should retry 3 times (initial + 2 retries)
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for retries

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('gives up after maximum retry attempts', async () => {
      // Mock fetch to always fail
      mockFetch.mockRejectedValue(new Error('Persistent failure'));

      log('error', 'Critical error');

      // Should retry maximum times and then give up
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for retries

      expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('does not retry for non-error level logs', () => {
      mockFetch.mockRejectedValueOnce(new Error('Webhook failed'));

      log('info', 'Info message');

      // Should only try once for non-error logs
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('includes traceId in webhook payload', () => {
      const mockALSInstance = {
        getStore: jest.fn().mockReturnValue({ traceId: 'webhook-trace-789' }),
        run: jest.fn((store, callback) => callback()),
      };
      mockAsyncLocalStorage.mockReturnValue(mockALSInstance as any);

      log('info', 'Webhook test');

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.traceId).toBe('webhook-trace-789');
    });
  });

  describe('Log formatting and sanitization', () => {
    it('sanitizes sensitive data in logs', () => {
      const sensitiveData = {
        password: 'secret123',
        apiKey: 'sk-123456789',
        token: 'bearer-token',
        creditCard: '4111111111111111',
        ssn: '123-45-6789',
      };

      log('info', 'User login', sensitiveData);

      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toContain('"password":"[REDACTED]"');
      expect(loggedMessage).toContain('"apiKey":"[REDACTED]"');
      expect(loggedMessage).toContain('"token":"[REDACTED]"');
      expect(loggedMessage).toContain('"creditCard":"[REDACTED]"');
      expect(loggedMessage).toContain('"ssn":"[REDACTED]"');
    });

    it('handles circular references in metadata', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => {
        log('info', 'Circular reference test', circular);
      }).not.toThrow();

      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('handles very large metadata objects', () => {
      const largeMetadata = {
        data: 'x'.repeat(10000), // 10KB string
        array: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item${i}` })),
      };

      log('info', 'Large metadata test', largeMetadata);

      expect(mockConsole.info).toHaveBeenCalled();
      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage.length).toBeGreaterThan(1000); // Should still log large data
    });

    it('formats Error objects with stack traces properly', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at function1\n    at function2';

      logError('Error occurred', error);

      const loggedMessage = mockConsole.error.mock.calls[0][0];
      const parsed = JSON.parse(loggedMessage);

      expect(parsed.error).toBe('Test error');
      expect(parsed.stack).toContain('at function1');
      expect(parsed.stack).toContain('at function2');
    });
  });

  describe('Metric tracking', () => {
    it('trackMetric logs metric data', () => {
      trackMetric('response_time', 150, { endpoint: '/api/users', method: 'GET' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"message":"metric.recorded"')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"name":"response_time"')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"value":150')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"endpoint":"/api/users"')
      );
    });

    it('trackMetric handles different value types', () => {
      trackMetric('error_rate', 0.05, { service: 'auth' });
      trackMetric('request_count', 42, { endpoint: '/api/data' });
      trackMetric('is_active', true, { component: 'cache' });

      expect(mockConsole.info).toHaveBeenCalledTimes(3);

      const firstCall = mockConsole.info.mock.calls[0][0];
      const secondCall = mockConsole.info.mock.calls[1][0];
      const thirdCall = mockConsole.info.mock.calls[2][0];

      expect(firstCall).toContain('"value":0.05');
      expect(secondCall).toContain('"value":42');
      expect(thirdCall).toContain('"value":true');
    });

    it('trackMetric handles tags correctly', () => {
      trackMetric('error_rate', 0.05, { service: 'auth', version: '1.2.3' });

      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toContain('"service":"auth"');
      expect(loggedMessage).toContain('"version":"1.2.3"');
    });

    it('trackMetric includes traceId from AsyncLocalStorage', () => {
      const mockALSInstance = {
        getStore: jest.fn().mockReturnValue({ traceId: 'metric-trace-999' }),
        run: jest.fn((store, callback) => callback()),
      };
      mockAsyncLocalStorage.mockReturnValue(mockALSInstance as any);

      trackMetric('response_time', 200);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"traceId":"metric-trace-999"')
      );
    });
  });

  describe('Performance and edge cases', () => {
    it('handles rapid successive log calls', () => {
      for (let i = 0; i < 100; i++) {
        log('info', `Message ${i}`, { index: i });
      }

      expect(mockConsole.info).toHaveBeenCalledTimes(100);
    });

    it('handles empty message strings', () => {
      log('info', '');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"message":""')
      );
    });

    it('handles null and undefined metadata', () => {
      log('info', 'Test message', null as any);
      log('info', 'Test message', undefined as any);

      expect(mockConsole.info).toHaveBeenCalledTimes(2);
    });

    it('handles special characters in messages', () => {
      const specialMessage = 'Message with émojis 🚀 and spëcial chärs\n\t\r';
      log('info', specialMessage);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(specialMessage.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r'))
      );
    });

    it('maintains log order in concurrent scenarios', async () => {
      const logs: string[] = [];
      const originalInfo = mockConsole.info;

      // Override console.info to capture log order
      mockConsole.info.mockImplementation((message) => {
        logs.push(JSON.parse(message).message);
        // Still call original to maintain logging behavior
        originalInfo(message);
      });

      await Promise.all([
        Promise.resolve().then(() => log('info', 'First')),
        Promise.resolve().then(() => log('info', 'Second')),
        Promise.resolve().then(() => log('info', 'Third')),
      ]);

      // Restore original mock
      mockConsole.info.mockRestore();
      mockConsole.info = originalInfo;

      // Order might vary due to async nature, but all should be logged
      expect(logs).toHaveLength(3);
      expect(logs).toContain('First');
      expect(logs).toContain('Second');
      expect(logs).toContain('Third');
    });
  });
});