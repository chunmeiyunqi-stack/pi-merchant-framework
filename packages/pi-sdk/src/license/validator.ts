// packages/pi-sdk/src/license/validator.ts
// License 验证器：签名校验 + 过期时间 + Feature Gate

import type {
  License,
  LicenseFeature,
  LicenseStatus,
  LicenseValidationOptions,
  LicenseValidationResult,
  SerializedLicense,
} from './types';

// ──────────────────────────────────────────────
// 常量
// ──────────────────────────────────────────────

/** 各 Tier 默认开放的功能特性 */
export const TIER_FEATURES: Record<License['tier'], LicenseFeature[]> = {
  starter: ['ai_routing'],
  professional: ['ai_routing', 'streaming', 'usage_tracking', 'webhook_monitoring'],
  enterprise: [
    'ai_routing',
    'streaming',
    'multi_tenant',
    'usage_tracking',
    'webhook_monitoring',
    'advanced_analytics',
  ],
};

/** 临近到期警告阈值（天） */
const EXPIRY_WARNING_DAYS = 30;

// ──────────────────────────────────────────────
// 签名验证
// ──────────────────────────────────────────────

/**
 * 构建 License 待签名数据字符串
 * 注意：字段顺序必须与签发时保持一致
 */
export function buildSignablePayload(license: SerializedLicense): string {
  return [
    license.id,
    license.issuedTo,
    license.merchantId,
    license.issuedAt,
    license.expiresAt,
    license.tier,
    license.features.sort().join(','),
    license.maxRequestsPerMonth?.toString() ?? '',
    license.maxTenants?.toString() ?? '',
    license.timestamp.toString(),
    license.nonce,
  ].join('|');
}

/**
 * 使用 Web Crypto API (HMAC-SHA256) 验证签名
 * 在生产环境中可替换为 RSA-SHA256 非对称验证
 */
export async function verifySignature(
  payload: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const sigBuffer = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    const payloadBuffer = encoder.encode(payload);

    // If it's an RSA public key in PEM format
    if (publicKey.includes('-----BEGIN PUBLIC KEY-----')) {
      const pemBody = publicKey
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/[\s\r\n]+/g, '');
      const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        keyData,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['verify']
      );

      return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sigBuffer, payloadBuffer);
    } else {
      // Fallback to default HMAC-SHA256 verification
      const keyData = Uint8Array.from(atob(publicKey), (c) => c.charCodeAt(0));
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      return await crypto.subtle.verify('HMAC', cryptoKey, sigBuffer, payloadBuffer);
    }
  } catch {
    // Invalid signature formatting or key structure
    return false;
  }
}

// ──────────────────────────────────────────────
// 反序列化
// ──────────────────────────────────────────────

/**
 * 将传输格式（SerializedLicense）还原为运行时 License 对象
 */
export function deserializeLicense(raw: SerializedLicense): License {
  return {
    ...raw,
    issuedAt: new Date(raw.issuedAt),
    expiresAt: new Date(raw.expiresAt),
  };
}

// ──────────────────────────────────────────────
// 核心验证逻辑
// ──────────────────────────────────────────────

/**
 * 验证 License 是否有效
 *
 * @param license 已反序列化的 License 对象
 * @param rawLicense 原始序列化 License（用于签名验证）
 * @param options 验证选项
 * @returns 验证结果
 */
export async function validateLicense(
  license: License,
  rawLicense: SerializedLicense,
  options: LicenseValidationOptions = {}
): Promise<LicenseValidationResult> {
  const now = new Date();

  // 1. 过期检查
  if (!options.skipExpiryCheck) {
    if (license.expiresAt < now) {
      const overdueDays = Math.ceil((now.getTime() - license.expiresAt.getTime()) / 86400000);
      return {
        valid: false,
        status: 'expired',
        license,
        daysRemaining: -overdueDays,
        error: `License expired ${overdueDays} day(s) ago`,
      };
    }
  }

  // 2. 防重放与合法时间验证
  if (!license.nonce || typeof license.nonce !== 'string' || license.nonce.trim() === '') {
    return {
      valid: false,
      status: 'invalid',
      license,
      error: 'License rejection: missing or invalid nonce',
    };
  }

  if (!license.timestamp || typeof license.timestamp !== 'number' || license.timestamp <= 0) {
    return {
      valid: false,
      status: 'invalid',
      license,
      error: 'License rejection: missing or invalid timestamp',
    };
  }

  // 允许 5 分钟的时钟偏差，但不能宣称为遥远未来的证书
  const maxAllowedSkew = 5 * 60 * 1000;
  if (license.timestamp > Date.now() + maxAllowedSkew) {
    return {
      valid: false,
      status: 'invalid',
      license,
      error:
        'License rejection: timestamp is in the future (invalid system clock or forged license)',
    };
  }

  // 3. 签名验证
  if (!options.skipSignatureCheck) {
    const publicKey = process.env.LICENSE_PUBLIC_KEY;
    if (!publicKey) {
      return {
        valid: false,
        status: 'invalid',
        error: 'LICENSE_PUBLIC_KEY environment variable is not set',
      };
    }

    const payload = buildSignablePayload(rawLicense);
    const isSignatureValid = await verifySignature(payload, license.signature, publicKey);

    if (!isSignatureValid) {
      return {
        valid: false,
        status: 'invalid',
        license,
        error: 'License signature verification failed',
      };
    }
  }

  // 4. Feature Gate 检查
  if (options.requiredFeatures && options.requiredFeatures.length > 0) {
    const missingFeatures = options.requiredFeatures.filter((f) => !license.features.includes(f));
    if (missingFeatures.length > 0) {
      return {
        valid: false,
        status: 'invalid',
        license,
        error: `License missing required features: ${missingFeatures.join(', ')}`,
      };
    }
  }

  // 5. 计算剩余天数
  const daysRemaining = Math.ceil((license.expiresAt.getTime() - now.getTime()) / 86400000);

  return {
    valid: true,
    status: 'valid',
    license,
    daysRemaining,
  };
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

/**
 * 检查 License 是否即将到期（默认 30 天内警告）
 */
export function isExpiringsoon(
  license: License,
  thresholdDays: number = EXPIRY_WARNING_DAYS
): boolean {
  const now = new Date();
  const threshold = new Date(now.getTime() + thresholdDays * 86400000);
  return license.expiresAt < threshold;
}

/**
 * 检查 License 是否开启了指定功能
 */
export function hasFeature(license: License, feature: LicenseFeature): boolean {
  return license.features.includes(feature);
}

/**
 * 判断 License 整体状态
 */
export function getLicenseStatus(license: License): LicenseStatus {
  const now = new Date();
  if (license.expiresAt < now) return 'expired';
  return 'valid';
}
