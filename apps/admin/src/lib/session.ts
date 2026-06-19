import crypto from 'crypto';

/**
 * Admin Session Token 签名密钥 —— 安全策略 (v2.1.0+)
 *
 * 🔒 安全原则（与 web 端 session.ts 一致）：
 *   1. 生产环境强制要求 PI_SESSION_SECRET 环境变量，长度 ≥ 32 字符，否则 crash。
 *   2. 开发/测试环境允许 fallback，但打警告。
 *   3. 不再使用公开的 fallback 字符串。
 *
 * 🚨 历史：v2.1.0 之前使用了 'dev_fallback_secret_for_pi_hmac_2026' 作为公开 fallback，已废弃。
 */

const MIN_SECRET_LENGTH = 32;
const DEV_FALLBACK_SECRET = 'DEV_ONLY_FALLBACK_DO_NOT_USE_IN_PRODUCTION_xxxxxx';

function resolveSessionSecret(): string {
  const envSecret = process.env.PI_SESSION_SECRET;
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    if (!envSecret) {
      throw new Error(
        'FATAL: PI_SESSION_SECRET environment variable is required in production. ' +
          'Generate one with: openssl rand -hex 32'
      );
    }
    if (envSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `FATAL: PI_SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters long in production. ` +
          `Current length: ${envSecret.length}.`
      );
    }
    if (
      envSecret === DEV_FALLBACK_SECRET ||
      envSecret.includes('dev_fallback_secret_for_pi_hmac')
    ) {
      throw new Error(
        'FATAL: PI_SESSION_SECRET appears to be a known public fallback. Generate a unique secret.'
      );
    }
    return envSecret;
  }

  if (!envSecret) {
    console.warn(
      '[admin-session] WARNING: PI_SESSION_SECRET not set — using dev-only fallback. ' +
        'This MUST NOT be used in production.'
    );
    return DEV_FALLBACK_SECRET;
  }

  if (envSecret.length < MIN_SECRET_LENGTH) {
    console.warn(
      `[admin-session] WARNING: PI_SESSION_SECRET is only ${envSecret.length} chars (recommended ≥ ${MIN_SECRET_LENGTH}).`
    );
  }

  return envSecret;
}

const SECRET_KEY = resolveSessionSecret();

export function verifySessionToken(token: string): string | null {
  if (!token || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  // Note: empty payload is allowed (decodes to ''). Only signature must be present.
  if (!signature) return null;

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
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
