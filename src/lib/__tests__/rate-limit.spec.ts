import { RateLimiter, getClientIp } from '@/lib/rate-limit';
import { createMocks } from 'node-mocks-http';

describe('Rate Limiting (rate-limit.ts)', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  afterEach(() => {
    rateLimiter.cleanup();
  });

  describe('基础限流功能', () => {
    it('应该在窗口期内正常工作', async () => {
      const clientId = 'test-client-1';
      const limit = 5;
      const window = 60000; // 1 分钟

      for (let i = 0; i < limit; i++) {
        const result = await rateLimiter.check(clientId, limit, window);
        expect(result.limited).toBe(false);
        expect(result.remaining).toBe(limit - i - 1);
      }
    });

    it('应该在超出限制后返回 limited: true', async () => {
      const clientId = 'test-client-2';
      const limit = 3;
      const window = 60000;

      // 使用完配额
      for (let i = 0; i < limit; i++) {
        await rateLimiter.check(clientId, limit, window);
      }

      // 超出限制
      const result = await rateLimiter.check(clientId, limit, window);
      expect(result.limited).toBe(true);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('应该包含正确的重试时间信息', async () => {
      const clientId = 'test-client-3';
      const limit = 1;
      const window = 5000;

      await rateLimiter.check(clientId, limit, window);

      const result = await rateLimiter.check(clientId, limit, window);
      expect(result.limited).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(window);
    });
  });

  describe('窗口期重置', () => {
    it('应该在窗口期过期后计数清零', async () => {
      const clientId = 'test-client-4';
      const limit = 2;
      const window = 100; // 100ms 的短窗口便于测试

      // 第一个窗口期
      await rateLimiter.check(clientId, limit, window);
      await rateLimiter.check(clientId, limit, window);

      let result = await rateLimiter.check(clientId, limit, window);
      expect(result.limited).toBe(true);

      // 等待窗口期过期
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 第二个窗口期应该重置
      result = await rateLimiter.check(clientId, limit, window);
      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(limit - 1);
    });

    it('应该为不同客户端独立维护计数', async () => {
      const limit = 1;
      const window = 60000;

      const result1 = await rateLimiter.check('client-a', limit, window);
      expect(result1.limited).toBe(false);

      const result2 = await rateLimiter.check('client-b', limit, window);
      expect(result2.limited).toBe(false);

      // client-a 超出限制
      const result3 = await rateLimiter.check('client-a', limit, window);
      expect(result3.limited).toBe(true);

      // client-b 仍未超出限制
      const result4 = await rateLimiter.check('client-b', limit, window);
      expect(result4.limited).toBe(true); // client-b 也已超出
    });
  });

  describe('过期条目清理', () => {
    it('应该定期清理过期条目', async () => {
      const clientId = 'test-client-cleanup';
      const limit = 1;
      const window = 50; // 50ms

      await rateLimiter.check(clientId, limit, window);

      // 等待条目过期
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 触发清理
      rateLimiter.cleanup();

      // 调用 check 应该显示为新请求
      const result = await rateLimiter.check(clientId, limit, window);
      expect(result.limited).toBe(false);
    });

    it('应该不清理活跃的条目', async () => {
      const clientId = 'test-client-active';
      const limit = 2;
      const window = 1000;

      await rateLimiter.check(clientId, limit, window);

      // 清理不应该移除活跃条目
      rateLimiter.cleanup();

      const result = await rateLimiter.check(clientId, limit, window);
      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('getClientIp() 客户端 IP 提取', () => {
    it('应该从 X-Forwarded-For 标头提取 IP', () => {
      const { req } = createMocks({
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1',
        },
      });

      const ip = getClientIp(req as any);
      expect(ip).toBe('192.168.1.100');
    });

    it('应该从 X-Real-IP 标头提取 IP', () => {
      const { req } = createMocks({
        headers: {
          'x-real-ip': '203.0.113.50',
        },
      });

      const ip = getClientIp(req as any);
      expect(ip).toBe('203.0.113.50');
    });

    it('应该从 socket.remoteAddress 获取 IP', () => {
      const { req } = createMocks({});
      (req.socket as any).remoteAddress = '127.0.0.1';

      const ip = getClientIp(req as any);
      expect(ip).toBe('127.0.0.1');
    });

    it('应该处理 IPv6 映射的 IPv4 地址', () => {
      const { req } = createMocks({});
      (req.socket as any).remoteAddress = '::ffff:192.168.1.1';

      const ip = getClientIp(req as any);
      expect(ip).toBe('192.168.1.1');
    });

    it('应该在无法获取 IP 时返回默认值', () => {
      const { req } = createMocks({});

      const ip = getClientIp(req as any);
      expect(ip).toBeDefined();
      expect(typeof ip).toBe('string');
    });
  });

  describe('多维度限流策略', () => {
    it('应该支持 IP 级别的限流', async () => {
      const ip = '192.168.1.1';
      const limit = 2;
      const window = 60000;

      const result1 = await rateLimiter.checkByIp(ip, limit, window);
      expect(result1.limited).toBe(false);

      const result2 = await rateLimiter.checkByIp(ip, limit, window);
      expect(result2.limited).toBe(false);

      const result3 = await rateLimiter.checkByIp(ip, limit, window);
      expect(result3.limited).toBe(true);
    });

    it('应该支持用户级别的限流', async () => {
      const userId = 'user-123';
      const limit = 3;
      const window = 60000;

      for (let i = 0; i < limit; i++) {
        const result = await rateLimiter.checkByUserId(userId, limit, window);
        expect(result.limited).toBe(false);
      }

      const result = await rateLimiter.checkByUserId(userId, limit, window);
      expect(result.limited).toBe(true);
    });

    it('应该支持 API 端点级别的限流', async () => {
      const endpoint = '/api/v1/generate';
      const limit = 5;
      const window = 60000;

      for (let i = 0; i < limit; i++) {
        const result = await rateLimiter.checkByEndpoint(endpoint, limit, window);
        expect(result.limited).toBe(false);
      }

      const result = await rateLimiter.checkByEndpoint(endpoint, limit, window);
      expect(result.limited).toBe(true);
    });
  });
});
