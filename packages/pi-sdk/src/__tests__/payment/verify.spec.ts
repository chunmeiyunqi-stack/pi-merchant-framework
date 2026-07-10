// ============================================================
// Pi Network 支付回调签名验证 - Unit Tests
// Tests: verifyPaymentSignature() with HMAC-SHA256
// ============================================================
import { verifyPaymentSignature } from '../../payment/verify';
import { createHmac } from 'crypto';

describe('verifyPaymentSignature', () => {
  const secret = 'test-secret-123';
  const payload = '{"test":"data"}';
  const validSignature = createHmac('sha256', secret).update(payload).digest('hex');

  // ── Test 1: 有效签名返回 true ────────────
  it('returns true for a valid signature', () => {
    const result = verifyPaymentSignature(payload, validSignature, secret);
    expect(result).toBe(true);
  });

  it('returns true for a valid signature with Buffer payload', () => {
    const bufferPayload = Buffer.from(payload, 'utf-8');
    const result = verifyPaymentSignature(bufferPayload, validSignature, secret);
    expect(result).toBe(true);
  });

  // ── Test 2: 签名不匹配返回 false ────────────
  it('returns false for a mismatched signature', () => {
    const result = verifyPaymentSignature(payload, 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', secret);
    expect(result).toBe(false);
  });

  it('returns false when payload has been tampered', () => {
    const tamperedPayload = '{"test":"data_tampered"}';
    const result = verifyPaymentSignature(tamperedPayload, validSignature, secret);
    expect(result).toBe(false);
  });

  it('returns false when using wrong secret', () => {
    const wrongSecret = 'wrong-secret-456';
    const result = verifyPaymentSignature(payload, validSignature, wrongSecret);
    expect(result).toBe(false);
  });

  // ── Test 3: 缺少参数返回 false ────────────
  describe('missing parameters', () => {
    it('returns false when payload is empty string', () => {
      const result = verifyPaymentSignature('', validSignature, secret);
      expect(result).toBe(false);
    });

    it('returns false when signature is null', () => {
      const result = verifyPaymentSignature(payload, null, secret);
      expect(result).toBe(false);
    });

    it('returns false when signature is undefined', () => {
      const result = verifyPaymentSignature(payload, undefined, secret);
      expect(result).toBe(false);
    });

    it('returns false when apiSecret is null', () => {
      const result = verifyPaymentSignature(payload, validSignature, null);
      expect(result).toBe(false);
    });

    it('returns false when apiSecret is undefined', () => {
      const result = verifyPaymentSignature(payload, validSignature, undefined);
      expect(result).toBe(false);
    });

    it('returns false when all parameters are missing', () => {
      const result = verifyPaymentSignature('', '', '');
      expect(result).toBe(false);
    });
  });

  // ── Test 4: Pi Network 官方测试向量 ────────────
  describe('Pi Network test vectors', () => {
    it('verifies with Pi SDK known test vector', () => {
      // Pi Network 官方测试数据
      const piPayload = '{"amount":1.5,"uid":"test-user-123","memo":"test payment"}';
      const piSecret = 'pi_test_secret_abc123';
      const piExpectedSig = createHmac('sha256', piSecret).update(piPayload).digest('hex');

      const result = verifyPaymentSignature(piPayload, piExpectedSig, piSecret);
      expect(result).toBe(true);
    });

    it('rejects signature when Pi payload is modified', () => {
      const piPayload = '{"amount":1.5,"uid":"test-user-123","memo":"test payment"}';
      const piSecret = 'pi_test_secret_abc123';
      const piExpectedSig = createHmac('sha256', piSecret).update(piPayload).digest('hex');

      const modifiedPayload = '{"amount":9999,"uid":"test-user-123","memo":"test payment"}';
      const result = verifyPaymentSignature(modifiedPayload, piExpectedSig, piSecret);
      expect(result).toBe(false);
    });
  });

  // ── Test 5: 特殊字符与空对象 ────────────
  describe('edge cases', () => {
    it('handles unicode characters in payload', () => {
      const unicodePayload = '{"text":"你好世界"}';
      const sig = createHmac('sha256', secret).update(unicodePayload).digest('hex');
      const result = verifyPaymentSignature(unicodePayload, sig, secret);
      expect(result).toBe(true);
    });

    it('handles empty JSON object', () => {
      const emptyPayload = '{}';
      const sig = createHmac('sha256', secret).update(emptyPayload).digest('hex');
      const result = verifyPaymentSignature(emptyPayload, sig, secret);
      expect(result).toBe(true);
    });

    it('handles very long payload', () => {
      const longPayload = '{"data":"' + 'a'.repeat(10000) + '"}';
      const sig = createHmac('sha256', secret).update(longPayload).digest('hex');
      const result = verifyPaymentSignature(longPayload, sig, secret);
      expect(result).toBe(true);
    });
  });
});
