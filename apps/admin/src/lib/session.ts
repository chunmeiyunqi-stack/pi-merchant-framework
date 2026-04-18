import crypto from 'crypto';

const SECRET_KEY = process.env.PI_SESSION_SECRET || 'dev_fallback_secret_for_pi_hmac_2026';

export function verifySessionToken(token: string): string | null {
  if (!token || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    return Buffer.from(payload, 'base64url').toString('utf8');
  } catch (error) {
    return null;
  }
}
