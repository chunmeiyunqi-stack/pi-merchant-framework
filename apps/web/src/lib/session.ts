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

/**
 * Signs a piUid into an HMAC-SHA256 signed opaque token.
 * Payload: JSON { uid, exp } → base64url → HMAC-SHA256 signature.
 */
export function signSessionToken(piUid: string, ttlSeconds = 60 * 60 * 24 * 7): string {
  const exp = Math.floor(Date.now() / 1000) + Math.max(0, Math.floor(ttlSeconds));
  const payloadObj = { uid: piUid, exp };
  const payloadJson = JSON.stringify(payloadObj);
  const payload = Buffer.from(payloadJson).toString('base64url');

  const hmac = crypto.createHmac('sha256', getSecretKey());
  hmac.update(payload);
  const signature = hmac.digest('base64url');

  return `${payload}.${signature}`;
}

/**
 * Verifies a session token. Returns the uid if valid, null otherwise.
 */
export function verifySessionToken(token: string): string | null {
  if (!token) {
    console.error('[session] verifySessionToken: missing token');
    return null;
  }

  if (!token.includes('.')) {
    console.error(
      '[session] verifySessionToken: token missing separator (expected payload.signature)'
    );
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    console.error('[session] verifySessionToken: empty payload or signature');
    return null;
  }

  const hmac = crypto.createHmac('sha256', getSecretKey());
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64url');

  if (signature !== expectedSignature) {
    console.error('[session] verifySessionToken: signature mismatch');
    return null;
  }

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');

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
    } catch (_jsonErr) {
      if (decoded && decoded.length > 0) return decoded;
      console.error('[session] verifySessionToken: decoded payload empty or invalid');
      return null;
    }
  } catch (error: any) {
    console.error('[session] verifySessionToken: payload base64url decode failed', {
      error: (error && error.message) || error,
    });
    return null;
  }
}
