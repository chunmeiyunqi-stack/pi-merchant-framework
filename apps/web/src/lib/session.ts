import crypto from 'crypto';

/**
 * Session Token 签名密钥 —— 安全策略 (v2.1.0+)
 *
 * 🔒 安全原则：
 *   1. 生产环境 (NODE_ENV=production) 强制要求 PI_SESSION_SECRET 环境变量
 *      且长度 ≥ 32 字符，否则启动时直接 crash（fail-fast）。
 *   2. 开发/测试环境允许使用 fallback 密钥，但会打警告。
 *   3. 不再在源码中暴露任何"看似真实"的密钥字符串，fallback 改为明显的
 *      "DEV_ONLY" 标记，让任何攻击者即使读到源码也无法在未知部署环境中复用。
 *
 * 🚨 历史：
 *   v2.1.0 之前使用了 'dev_fallback_secret_for_pi_hmac_2026' 作为公开 fallback，
 *   由于本仓库为 public，该字符串等同于公开密钥 —— 已废弃。
 */

const MIN_SECRET_LENGTH = 32;
const DEV_FALLBACK_SECRET = 'DEV_ONLY_FALLBACK_DO_NOT_USE_IN_PRODUCTION_xxxxxx';

function resolveSessionSecret(): string {
  const envSecret = process.env.PI_SESSION_SECRET;
  const nodeEnv = process.env.NODE_ENV || 'development';

  // 生产环境：必须设置 PI_SESSION_SECRET 且长度足够
  if (nodeEnv === 'production') {
    if (!envSecret) {
      // fail-fast：生产环境绝不允许 fallback
      throw new Error(
        'FATAL: PI_SESSION_SECRET environment variable is required in production. ' +
          'Generate one with: openssl rand -hex 32'
      );
    }
    if (envSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `FATAL: PI_SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters long in production. ` +
          `Current length: ${envSecret.length}. Generate one with: openssl rand -hex 32`
      );
    }
    if (
      envSecret === DEV_FALLBACK_SECRET ||
      envSecret.includes('dev_fallback_secret_for_pi_hmac')
    ) {
      throw new Error(
        'FATAL: PI_SESSION_SECRET appears to be a known public fallback. ' +
          'Generate a unique secret with: openssl rand -hex 32'
      );
    }
    return envSecret;
  }

  // 开发/测试环境：允许 fallback，但打警告
  if (!envSecret) {
    console.warn(
      '[session] WARNING: PI_SESSION_SECRET not set — using dev-only fallback. ' +
        'This MUST NOT be used in production. Set PI_SESSION_SECRET to a 32+ char random string.'
    );
    return DEV_FALLBACK_SECRET;
  }

  if (envSecret.length < MIN_SECRET_LENGTH) {
    console.warn(
      `[session] WARNING: PI_SESSION_SECRET is only ${envSecret.length} chars (recommended ≥ ${MIN_SECRET_LENGTH}).`
    );
  }

  return envSecret;
}

const SECRET_KEY = resolveSessionSecret();

// 启动时记录密钥来源（仅打印 source 类型，绝不打印密钥本身）
try {
  const source = process.env.PI_SESSION_SECRET ? 'env' : 'dev-fallback';
  console.error(
    `[session] SECRET_KEY source: ${source} (NODE_ENV=${process.env.NODE_ENV || 'development'})`
  );
} catch (_e) {
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

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64url');

  if (signature !== expectedSignature) {
    console.error('[session] verifySessionToken: signature mismatch', {
      provided: signature,
      expected: expectedSignature,
    });
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
    } catch (_jsonErr) {
      // 不是 JSON -> 兼容旧格式：解码即为 uid
      if (decoded && decoded.length > 0) return decoded;
      console.error('[session] verifySessionToken: decoded payload empty or invalid');
      return null;
    }
  } catch (error: unknown) {
    console.error('[session] verifySessionToken: payload base64url decode failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
