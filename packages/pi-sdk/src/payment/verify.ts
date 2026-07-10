// ============================================================
// Pi Network 支付回调签名验证
// Pi Webhook 使用 HMAC-SHA256 对 payload 进行签名
// 签名头: X-Pi-Signature
// ============================================================

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * 验证 Pi Network webhook 回调签名
 *
 * Pi Platform 在每个 POST 回调请求中附带 X-Pi-Signature header，
 * 值为 HMAC-SHA256(payload, apiSecret) 的十六进制字符串。
 *
 * @param payload - 回调请求的原始 body（字符串或 Buffer）
 * @param signature - X-Pi-Signature header 的值（hex string）
 * @param apiSecret - Pi API Secret（俎环境变量获取，不同于 API Key）
 * @returns 签名匹配返回 true，否则 false
 */
export function verifyPaymentSignature(
  payload: string | Buffer,
  signature: string | undefined | null,
  apiSecret: string | undefined | null
): boolean {
  if (!payload || !signature || !apiSecret) {
    return false;
  }

  const expectedSig = createHmac('sha256', apiSecret)
    .update(typeof payload === 'string' ? payload : payload.toString('utf-8'))
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    const actualBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

