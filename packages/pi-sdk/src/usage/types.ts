// packages/pi-sdk/src/usage/types.ts
// 用量统计核心类型定义

/** 用量记录类型 */
export type UsageEventType = 'ai_request' | 'stream_request' | 'auth' | 'payment' | 'api_call';

/**
 * 单次用量记录
 */
export interface UsageRecord {
  /** 记录唯一 ID */
  id: string;
  /** 所属租户 ID */
  tenantId: string;
  /** 商户 ID */
  merchantId: string;
  /** 事件类型 */
  type: UsageEventType;
  /** 发生时间 */
  timestamp: Date;
  /** 消耗的 Token 数量（AI 请求适用） */
  tokensUsed?: number;
  /** AI 提供商（AI 请求适用） */
  provider?: string;
  /** AI 模型名称 */
  model?: string;
  /** 请求延迟（ms） */
  latencyMs?: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息（失败时） */
  error?: string;
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/** 用量统计汇总 */
export interface UsageSummary {
  tenantId: string;
  merchantId: string;
  /** 统计周期起始时间 */
  periodStart: Date;
  /** 统计周期结束时间 */
  periodEnd: Date;
  /** 总请求次数 */
  totalRequests: number;
  /** 成功请求次数 */
  successRequests: number;
  /** 失败请求次数 */
  failedRequests: number;
  /** 总 Token 消耗 */
  totalTokensUsed: number;
  /** 平均请求延迟（ms） */
  avgLatencyMs: number;
  /** 按类型分组统计 */
  byType: Partial<Record<UsageEventType, number>>;
  /** 按提供商分组统计 */
  byProvider: Record<string, number>;
}

/** 配额使用情况 */
export interface QuotaStatus {
  tenantId: string;
  /** 本月已使用请求次数 */
  usedRequestsThisMonth: number;
  /** 本月配额上限 */
  maxRequestsPerMonth: number;
  /** 本月剩余次数 */
  remainingRequests: number;
  /** 使用率 (0-1) */
  usageRatio: number;
  /** 是否已超配额 */
  isExceeded: boolean;
  /** 是否即将到达配额阈值（>80%） */
  isNearLimit: boolean;
  /** 配额重置时间（下月1日） */
  resetAt: Date;
}

/** 用量 Flush 结果 */
export interface FlushResult {
  flushed: number;
  failed: number;
  destination: 'webhook' | 'console';
}
