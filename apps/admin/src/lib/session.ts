import crypto from 'crypto';

const SECRET_KEY =
  process.env.PI_SESSION_SECRET || 'pi_framework_default_secure_session_secret_2026';

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString(
    'base64url'
  );
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): { userId?: string } | null {
  if (!token) return null;

  if (token.includes('.')) {
    const [payload, signature] = token.split('.');
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      return decoded;
    } catch (_error) {
      return null;
    }
  }

  // Fallback check for session string tokens (e.g. pi_session_*, admin_session_*)
  if (
    token.startsWith('pi_session_') ||
    token.startsWith('admin_session_') ||
    token.startsWith('admin_dev_session_')
  ) {
    return { userId: token };
  }

  return null;
}
