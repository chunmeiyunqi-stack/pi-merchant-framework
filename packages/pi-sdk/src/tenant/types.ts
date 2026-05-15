// packages/pi-sdk/src/tenant/types.ts
// 多租户架构核心类型定义

import type { LicenseFeature, LicenseTier } from '../license/types';

/** 租户状态 */
export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

/** 租户的 AI 提供商偏好配置 */
export interface TenantAIConfig {
  /** 该租户使用的主 AI 提供商 */
  primaryProvider?: 'openai' | 'anthropic' | 'ollama';
  /** 该租户的备选提供商列表 */
  fallbackProviders?: Array<'openai' | 'anthropic' | 'ollama'>;
  /** 该租户的最大 Token 数 */
  maxTokens?: number;
  /** 该租户的温度参数 */
  temperature?: number;
  /** 该租户的系统提示词前缀 */
  systemPromptPrefix?: string;
}

/** 租户配额配置 */
export interface TenantQuota {
  /** 每月最大 AI 请求次数 */
  maxRequestsPerMonth: number;
  /** 每日最大 AI 请求次数 */
  maxRequestsPerDay?: number;
  /** 每月最大 Token 消耗量 */
  maxTokensPerMonth?: number;
  /** 最大并发请求数 */
  maxConcurrentRequests?: number;
}

/**
 * 租户核心接口
 * 代表框架内的一个独立业务主体
 */
export interface Tenant {
  /** 租户唯一标识 */
  id: string;
  /** 租户名称（商户/企业名） */
  name: string;
  /** 绑定的主商户 ID（与 License merchantId 关联） */
  merchantId: string;
  /** 租户当前状态 */
  status: TenantStatus;
  /** 租户套餐等级（继承或覆盖 License 等级） */
  tier: LicenseTier;
  /** 该租户已激活的功能特性 */
  features: LicenseFeature[];
  /** AI 配置 */
  aiConfig?: TenantAIConfig;
  /** 配额限制 */
  quota?: TenantQuota;
  /** 租户创建时间 */
  createdAt: Date;
  /** 最后活跃时间 */
  lastActiveAt?: Date;
  /** 租户自定义元数据 */
  metadata?: Record<string, unknown>;
}

/** 租户上下文（请求级别） */
export interface TenantContext {
  tenant: Tenant;
  /** 当前请求的用户 ID */
  userId?: string;
  /** 请求的功能特性 */
  requestedFeature?: LicenseFeature;
}

/** 租户创建参数 */
export interface CreateTenantParams {
  name: string;
  merchantId: string;
  tier?: LicenseTier;
  features?: LicenseFeature[];
  aiConfig?: TenantAIConfig;
  quota?: TenantQuota;
  metadata?: Record<string, unknown>;
}

/** 租户列表查询结果 */
export interface TenantListResult {
  tenants: Tenant[];
  total: number;
}
