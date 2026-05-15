// packages/pi-sdk/src/license/types.ts
// License 系统核心类型定义

/** 授权功能特性枚举 */
export type LicenseFeature =
  | 'ai_routing'
  | 'streaming'
  | 'multi_tenant'
  | 'usage_tracking'
  | 'webhook_monitoring'
  | 'advanced_analytics';

/** License 状态 */
export type LicenseStatus = 'valid' | 'expired' | 'invalid' | 'suspended';

/** License 套餐等级 */
export type LicenseTier = 'starter' | 'professional' | 'enterprise';

/**
 * License 核心接口
 * 代表一份已颁发的商业授权证书
 */
export interface License {
  /** 全局唯一 License ID */
  id: string;
  /** 授权对象（商户名称或机构名） */
  issuedTo: string;
  /** 授权商户 ID（绑定 merchantId） */
  merchantId: string;
  /** License 颁发时间 */
  issuedAt: Date;
  /** License 到期时间 */
  expiresAt: Date;
  /** 授权套餐等级 */
  tier: LicenseTier;
  /** 已授权的功能特性列表 */
  features: LicenseFeature[];
  /** 每月最大请求次数限制（undefined 表示不限） */
  maxRequestsPerMonth?: number;
  /** 最大租户数量限制（undefined 表示不限） */
  maxTenants?: number;
  /** RSA-SHA256 数字签名（base64 编码） */
  signature: string;
  /** License 元数据（扩展字段） */
  metadata?: Record<string, unknown>;
}

/** License 验证结果 */
export interface LicenseValidationResult {
  valid: boolean;
  status: LicenseStatus;
  license?: License;
  /** 距离到期的剩余天数（负数表示已过期） */
  daysRemaining?: number;
  /** 错误详情 */
  error?: string;
}

/** License 校验选项 */
export interface LicenseValidationOptions {
  /** 是否跳过签名验证（仅用于开发/测试环境） */
  skipSignatureCheck?: boolean;
  /** 是否跳过过期时间验证 */
  skipExpiryCheck?: boolean;
  /** 需要验证的功能特性（全部满足才通过） */
  requiredFeatures?: LicenseFeature[];
}

/** License 序列化格式（用于传输和存储） */
export interface SerializedLicense {
  id: string;
  issuedTo: string;
  merchantId: string;
  issuedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  tier: LicenseTier;
  features: LicenseFeature[];
  maxRequestsPerMonth?: number;
  maxTenants?: number;
  signature: string;
  metadata?: Record<string, unknown>;
}
