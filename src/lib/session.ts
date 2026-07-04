import * as crypto from 'crypto';

export type SessionToken = {
  userId: string;
  iat: number;
  exp: number;
  version?: string;
};

export function signSessionToken(
  piUid: string,
  secret = (() => {
    const value = process.env.JWT_SECRET;
    if (value) return value;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variable: JWT_SECRET');
    }
    return 'dev-secret';
  })()
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 24 * 60 * 60; // 24 hours
  const nonce = Math.random().toString(36).slice(2);
  const payload = Buffer.from(
    JSON.stringify({ userId: piUid, iat, exp, version: '1.0.0', n: nonce })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifySessionToken(
  token: string | null | undefined,
  secret = (() => {
    const value = process.env.JWT_SECRET;
    if (value) return value;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variable: JWT_SECRET');
    }
    return 'dev-secret';
  })()
) {
  if (!token || typeof token !== 'string') return { valid: false, error: 'invalid' } as any;
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, error: 'bad_format' } as any;
  const [headerB64, payloadB64, signature] = parts;
  try {
    const expectedUrl = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    const expectedStd = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64');
    if (signature !== expectedUrl && signature !== expectedStd)
      return { valid: false, error: 'signature_mismatch' } as any;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return { valid: false, error: 'expired' } as any;
    return { valid: true, ...payload } as any;
  } catch (e: any) {
    try {
      // backward compatible: accept simple base64-encoded opaque token
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      return { valid: true, ...decoded } as any;
    } catch (_err) {
      return { valid: false, error: String(e) } as any;
    }
  }
}

export default { signSessionToken, verifySessionToken };
