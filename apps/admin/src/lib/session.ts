import crypto from 'crypto';

let _secretKey: string | null = null;

function getSecretKey(): string {
  if (_secretKey) return _secretKey;
  const secret = process.env.PI_SESSION_SECRET;
  if (secret) {
    _secretKey = secret;
    return _secretKey;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variable: PI_SESSION_SECRET');
  }
  _secretKey = 'dev_fallback_secret_for_pi_hmac_2026';
  return _secretKey;
}

export function verifySessionToken(token: string): string | null {
  if (!token || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');

  const hmac = crypto.createHmac('sha256', getSecretKey());
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    return Buffer.from(payload, 'base64url').toString('utf8');
  } catch (_error) {
    return null;
  }
}
