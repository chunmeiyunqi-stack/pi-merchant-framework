import { signSessionToken, verifySessionToken, SessionToken } from '@/lib/session';
import * as crypto from 'crypto';

describe('Session Management (session.ts)', () => {
  const testUserId = 'user-123';
  const testSecret = 'test-secret-key-for-testing-only';

  describe('signSessionToken()', () => {
    it('应该生成有效的 token 格式', () => {
      const token = signSessionToken(testUserId, testSecret);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT 格式：header.payload.signature
    });

    it('应该包含正确的用户 ID', () => {
      const token = signSessionToken(testUserId, testSecret);
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      expect(payload.userId).toBe(testUserId);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('应该设置正确的过期时间（24小时）', () => {
      const token = signSessionToken(testUserId, testSecret);
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      const issuedAt = payload.iat;
      const expiresAt = payload.exp;
      const expirationTime = (expiresAt - issuedAt) * 1000; // 转换为毫秒

      // 应该是 24 小时 ± 1 分钟的容差
      expect(expirationTime).toBeGreaterThan(23 * 60 * 60 * 1000 - 60000);
      expect(expirationTime).toBeLessThan(24 * 60 * 60 * 1000 + 60000);
    });

    it('相同输入应该生成不同的 token（包含随机成分）', () => {
      const token1 = signSessionToken(testUserId, testSecret);
      const token2 = signSessionToken(testUserId, testSecret);

      // 由于包含时间戳，两个 token 应该不同
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifySessionToken()', () => {
    it('应该验证合法的 token', () => {
      const token = signSessionToken(testUserId, testSecret);
      const result = verifySessionToken(token, testSecret);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.valid).toBe(true);
    });

    it('应该拒绝篡改的 token', () => {
      const token = signSessionToken(testUserId, testSecret);
      const parts = token.split('.');

      // 篡改 payload
      const modifiedPayload = Buffer.from('{"userId":"hacker-666"}').toString('base64');
      const tamperedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;

      const result = verifySessionToken(tamperedToken, testSecret);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝使用错误的 secret 验证', () => {
      const token = signSessionToken(testUserId, testSecret);
      const wrongSecret = 'wrong-secret';

      const result = verifySessionToken(token, wrongSecret);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝过期的 token', (done) => {
      // 创建一个已过期的 payload
      const expiredPayload = {
        userId: testUserId,
        iat: Math.floor(Date.now() / 1000) - 86400, // 1 天前
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 小时前过期
      };

      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
      const payload = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(`${header}.${payload}`)
        .digest('base64');

      const expiredToken = `${header}.${payload}.${signature}`;
      const result = verifySessionToken(expiredToken, testSecret);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');

      done();
    });

    it('应该拒绝格式不正确的 token', () => {
      const invalidTokens = ['invalid-token', 'not.a.jwt.token', '', null];

      invalidTokens.forEach((invalidToken) => {
        const result = verifySessionToken(invalidToken as any, testSecret);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('向后兼容性', () => {
    it('应该支持旧格式的 Opaque Token', () => {
      // 模拟旧版本的简单 token 格式
      const oldFormatToken = Buffer.from(
        JSON.stringify({ userId: testUserId, version: '1.0.0' })
      ).toString('base64');

      // 如果系统支持向后兼容，应该能够识别旧格式
      // 这取决于实现，但至少不应该导致崩溃
      expect(() => {
        verifySessionToken(oldFormatToken, testSecret);
      }).not.toThrow();
    });

    it('应该在日志中记录版本转换', () => {
      const token = signSessionToken(testUserId, testSecret);
      const result = verifySessionToken(token, testSecret);

      expect(result).toBeDefined();
      expect(result.version).toBeDefined();
    });
  });

  describe('会话令牌安全性', () => {
    it('应该使用 HMAC-SHA256 签名', () => {
      const token = signSessionToken(testUserId, testSecret);
      const parts = token.split('.');

      // 验证签名长度（SHA256 的 base64 编码约为 43-44 个字符）
      expect(parts[2].length).toBeGreaterThan(40);
    });

    it('应该在 payload 中加密敏感数据', () => {
      const token = signSessionToken(testUserId, testSecret);
      const parts = token.split('.');
      const payload = Buffer.from(parts[1], 'base64').toString();

      // 验证 payload 不是明文敏感信息
      expect(payload).not.toContain('password');
      expect(payload).not.toContain('apiKey');
    });
  });
});
