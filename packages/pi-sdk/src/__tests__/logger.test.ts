import { log, logEvent, logError, logWarn, logDebug, trackMetric } from '../logger';

// Mock fetch and console methods
global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.MockedFunction<typeof fetch>;
const mockConsole = {
  info: jest.spyOn(console, 'info').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
};

describe('Logger', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MONITORING_WEBHOOK_URL;
    delete process.env.APP_NAME;
  });

  afterEach(() => {
    mockConsole.info.mockClear();
    mockConsole.warn.mockClear();
    mockConsole.error.mockClear();
    mockConsole.debug.mockClear();
  });

  describe('Basic logging functionality', () => {
    it('logs info messages to console', () => {
      log('info', 'Test message');
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('"level":"info"'));
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test message"')
      );
    });

    it('logs error messages to console', () => {
      log('error', 'Error message');
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('"level":"error"'));
    });

    it('logs warn messages to console', () => {
      log('warn', 'Warning message');
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('"level":"warn"'));
    });

    it('logs debug messages to console', () => {
      log('debug', 'Debug message');
      expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringContaining('"level":"debug"'));
    });

    it('includes timestamp in log output', () => {
      const beforeTime = new Date().getTime() - 1000;
      log('info', 'Test message');
      const loggedMessage = mockConsole.info.mock.calls[0][0];
      const parsed = JSON.parse(loggedMessage);
      expect(new Date(parsed.timestamp).getTime()).toBeGreaterThanOrEqual(beforeTime);
    });

    it('includes metadata in log output', () => {
      log('info', 'Message with metadata', { userId: '123', action: 'login' });
      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toContain('"userId":"123"');
      expect(loggedMessage).toContain('"action":"login"');
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
        nested: { deep: { value: 'test' } },
      };
      log('info', 'Complex log', complexMetadata);
      const loggedMessage = mockConsole.info.mock.calls[0][0];
      const parsed = JSON.parse(loggedMessage);
      expect(parsed.metadata.user.id).toBe('123');
      expect(parsed.metadata.nested.deep.value).toBe('test');
    });
  });

  describe('Convenience logging functions', () => {
    it('logEvent calls log with info level', () => {
      logEvent('Event occurred', { eventId: '123' });
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('"level":"info"'));
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Event occurred"')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('"eventId":"123"'));
    });

    it('logError handles Error objects', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      logError('Error occurred', error, { userId: '123' });
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('"level":"error"'));
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Error occurred"')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('"userId":"123"'));
    });

    it('logWarn calls log with warn level', () => {
      logWarn('Warning message', { severity: 'high' });
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('"level":"warn"'));
    });

    it('logDebug calls log with debug level', () => {
      logDebug('Debug info', { component: 'auth' });
      expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringContaining('"level":"debug"'));
    });

    it('trackMetric logs metric data', () => {
      trackMetric('response_time', 150, { endpoint: '/api/users' });
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"message":"metric.recorded"')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('"name":"response_time"')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('"value":150'));
    });
  });

  describe('Webhook forwarding and degradation', () => {
    beforeEach(() => {
      process.env.MONITORING_WEBHOOK_URL = 'https://webhook.example.com/log';
      mockFetch.mockResolvedValue({ ok: true } as Response);
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

    it('falls back to console.warn on webhook network failure', async () => {
      // Mock fetch rejection
      mockFetch.mockRejectedValueOnce(new Error('Network disconnected'));

      log('info', 'Test message');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Wait a microtask for the Promise.catch to trigger
      await new Promise(process.nextTick);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Monitoring webhook failed"')
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Network disconnected')
      );
    });
  });

  describe('Log formatting and sanitization', () => {
    it('handles circular references in metadata gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => {
        log('info', 'Circular reference test', circular);
      }).not.toThrow();

      expect(mockConsole.info).toHaveBeenCalled();
      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toContain('[Circular]');
    });
  });
});
