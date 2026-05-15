// packages/pi-sdk/src/license/manager.ts
// License 管理器：加载 + 内存缓存 + 强制校验

import { logError, logEvent, logWarn } from '../logger';
import type { LicenseFeature, LicenseValidationResult, SerializedLicense } from './types';
import {
  deserializeLicense,
  getLicenseStatus,
  hasFeature,
  isExpiringsoon,
  validateLicense,
} from './validator';

// ──────────────────────────────────────────────
// 内存缓存
// ──────────────────────────────────────────────

interface CachedLicense {
  result: LicenseValidationResult;
  cachedAt: number;
}

/** 缓存有效期：5 分钟 */
const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, CachedLicense>();

// ──────────────────────────────────────────────
// 加载与解析
// ──────────────────────────────────────────────

/**
 * 从环境变量加载并解析 License
 * 环境变量 LICENSE_PAYLOAD 应存放 base64 编码的 JSON
 */
export function loadLicenseFromEnv(): SerializedLicense | null {
  const raw = process.env.LICENSE_PAYLOAD;
  if (!raw) return null;

  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    return JSON.parse(decoded) as SerializedLicense;
  } catch (err) {
    logError('Failed to parse LICENSE_PAYLOAD', err);
    return null;
  }
}

/**
 * 从 JSON 字符串解析 License
 */
export function parseLicense(json: string): SerializedLicense | null {
  try {
    return JSON.parse(json) as SerializedLicense;
  } catch (err) {
    logError('Failed to parse license JSON', err);
    return null;
  }
}

// ──────────────────────────────────────────────
// 验证与缓存
// ──────────────────────────────────────────────

/**
 * 验证并缓存 License
 * 使用 License ID 作为缓存键
 */
export async function verifyAndCacheLicense(
  rawLicense: SerializedLicense,
  skipSignatureCheck = false
): Promise<LicenseValidationResult> {
  const cacheKey = rawLicense.id;
  const now = Date.now();

  // 命中缓存
  const cached = cache.get(cacheKey);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.result;
  }

  const license = deserializeLicense(rawLicense);

  const result = await validateLicense(license, rawLicense, {
    skipSignatureCheck: skipSignatureCheck || process.env.NODE_ENV === 'test',
    requiredFeatures: [],
  });

  // 缓存结果
  cache.set(cacheKey, { result, cachedAt: now });

  // 告警：即将到期
  if (result.valid && result.license && isExpiringsoon(result.license)) {
    logWarn('License is expiring soon', {
      licenseId: result.license.id,
      expiresAt: result.license.expiresAt.toISOString(),
      daysRemaining: result.daysRemaining,
    });
  }

  if (result.valid) {
    logEvent('License verified', {
      licenseId: license.id,
      issuedTo: license.issuedTo,
      tier: license.tier,
      daysRemaining: result.daysRemaining,
      status: getLicenseStatus(license),
    });
  } else {
    logError('License verification failed', undefined, {
      licenseId: license.id,
      status: result.status,
      error: result.error,
    });
  }

  return result;
}

/** 手动清除缓存（用于测试或强制刷新） */
export function clearLicenseCache(licenseId?: string): void {
  if (licenseId) {
    cache.delete(licenseId);
  } else {
    cache.clear();
  }
}

// ──────────────────────────────────────────────
// 便捷 API
// ──────────────────────────────────────────────

/**
 * 从环境变量加载并验证 License
 * 是大多数服务初始化时的入口
 */
export async function getActiveLicense(): Promise<LicenseValidationResult> {
  const rawLicense = loadLicenseFromEnv();

  if (!rawLicense) {
    // 开发环境：允许无 License 运行
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      logWarn('No LICENSE_PAYLOAD found — running in development mode without license enforcement');
      return {
        valid: true,
        status: 'valid',
        daysRemaining: 365,
        license: {
          id: 'dev-license',
          issuedTo: 'Development',
          merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID ?? 'dev',
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 86400000),
          tier: 'enterprise',
          features: [
            'ai_routing',
            'streaming',
            'multi_tenant',
            'usage_tracking',
            'webhook_monitoring',
            'advanced_analytics',
          ],
          signature: 'dev-signature',
        },
      };
    }

    return {
      valid: false,
      status: 'invalid',
      error: 'No license found. Please set LICENSE_PAYLOAD environment variable.',
    };
  }

  return verifyAndCacheLicense(rawLicense);
}

/**
 * 断言 License 已激活某功能，否则抛出错误
 */
export async function requireFeature(feature: LicenseFeature): Promise<void> {
  const result = await getActiveLicense();

  if (!result.valid || !result.license) {
    throw new Error(`License invalid: ${result.error ?? 'unknown error'}`);
  }

  if (!hasFeature(result.license, feature)) {
    throw new Error(
      `Feature '${feature}' is not available in your current license tier (${result.license.tier}). Please upgrade.`
    );
  }
}
