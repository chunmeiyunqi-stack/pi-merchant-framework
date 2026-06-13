import crypto from 'crypto';

// 使用不可推导的密钥盐进行服务端签名。生产环境请确保配置了独立的环境变量
const SECRET_KEY = process.env.PI_SESSION_SECRET || 'dev_fallback_secret_for_pi_hmac_2026';

// Debug: surface whether the process is using env-provided secret or the fallback
try {
  const source = process.env.PI_SESSION_SECRET ? 'env' : 'fallback';
  console.error('[session] SECRET_KEY source:', source);
} catch (e) {
  /* ignore */
}

/**
 * 将真实的 piUid 打包并进行 HMAC-SHA256 签名，生成客户端不可篡改的 Opaque Token
 * 新格式 payload 为 JSON: { uid, exp }，然后 base64url 编码后签名。
 * 兼容旧格式（仅 base64(uid)）以便平滑过渡。
 */
export function signSessionToken(piUid: string, ttlSeconds = 60 * 60): string {
  const exp = Math.floor(Date.now() / 1000) + Math.max(0, Math.floor(ttlSeconds));
  const payloadObj = { uid: piUid, exp };
  const payloadJson = JSON.stringify(payloadObj);
  const payload = Buffer.from(payloadJson).toString('base64url');

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('base64url');

  return `${payload}.${signature}`;
}

/**
 * 验证收到的 Session Token，如果被篡改则返回 null
 */
export function verifySessionToken(token: string): string | null {
  if (!token) {
    console.error('[session] verifySessionToken: missing token');
    return null;
  }

  if (!token.includes('.')) {
    console.error('[session] verifySessionToken: token missing separator (expected payload.signature)');
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    console.error('[session] verifySessionToken: empty payload or signature');
    return null;
  }

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64url');

  if (signature !== expectedSignature) {
    console.error('[session] verifySessionToken: signature mismatch', { provided: signature, expected: expectedSignature });
    return null;
  }

  // 验证签名通过后，解码并支持新版 JSON payload 或旧版纯 uid 字符串
  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');

    // 优先尝试解析为 JSON（新格式）
    try {
      const obj = JSON.parse(decoded);
      const uid = typeof obj.uid === 'string' ? obj.uid : null;
      const exp = typeof obj.exp === 'number' ? obj.exp : null;
      if (!uid) {
        console.error('[session] verifySessionToken: payload JSON missing uid');
        return null;
      }
      if (exp && Math.floor(Date.now() / 1000) > exp) {
        console.error('[session] verifySessionToken: token expired', { exp });
        return null;
      }
      return uid;
    } catch (jsonErr) {
      // 不是 JSON -> 兼容旧格式：解码即为 uid
      if (decoded && decoded.length > 0) return decoded;
      console.error('[session] verifySessionToken: decoded payload empty or invalid');
      return null;
    }
  } catch (error) {
    console.error('[session] verifySessionToken: payload base64url decode failed', { error: (error && error.message) || error });
    return null;
  }
}
