import crypto from 'crypto';

// 使用不可推导的密钥盐进行服务端签名。生产环境请确保配置了独立的环境变量
const SECRET_KEY = process.env.PI_SESSION_SECRET || 'dev_fallback_secret_for_pi_hmac_2026';

/**
 * 将真实的 piUid 打包并进行 HMAC-SHA256 签名，生成客户端不可篡改的 Opaque Token
 */
export function signSessionToken(piUid: string): string {
  // 结构设计: base64(piUid) + '.' + HMAC(base64(piUid))
  const payload = Buffer.from(piUid).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('base64url');
  
  return `${payload}.${signature}`;
}

/**
 * 验证收到的 Session Token，如果被篡改则返回 null
 */
export function verifySessionToken(token: string): string | null {
  if (!token || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  // 解码出真实的 UID
  try {
    return Buffer.from(payload, 'base64url').toString('utf8');
  } catch (error) {
    return null;
  }
}
