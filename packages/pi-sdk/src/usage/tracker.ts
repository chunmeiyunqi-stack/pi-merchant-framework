// packages/pi-sdk/src/usage/tracker.ts
// 用量追踪器：请求计数 + 配额强制执行 + 周期性 Flush

import { logError, logEvent, logWarn, trackMetric } from '../logger';
import type { FlushResult, QuotaStatus, UsageEventType, UsageRecord, UsageSummary } from './types';

// ──────────────────────────────────────────────
// 内存缓冲区
// ──────────────────────────────────────────────

/** 待 Flush 的用量缓冲区 */
const buffer: UsageRecord[] = [];

/** 月度计数器：key = `${tenantId}:${YYYY-MM}` */
const monthlyCounters = new Map<string, number>();

/** Flush 定时器 */
let flushTimer: ReturnType<typeof setInterval> | null = null;

/** 默认 Flush 间隔：60 秒 */
const DEFAULT_FLUSH_INTERVAL_MS = 60 * 1000;

/** 缓冲区最大条数（超出时触发紧急 Flush） */
const MAX_BUFFER_SIZE = 500;

// ──────────────────────────────────────────────
// 辅助函数
// ──────────────────────────────────────────────

function getMonthKey(tenantId: string): string {
  const now = new Date();
  return `${tenantId}:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function generateRecordId(): string {
  return `usage_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getMonthResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

// ──────────────────────────────────────────────
// 核心 API
// ──────────────────────────────────────────────

/**
 * 记录一次用量事件
 */
export function trackUsage(params: {
  tenantId: string;
  merchantId: string;
  type: UsageEventType;
  tokensUsed?: number;
  provider?: string;
  model?: string;
  latencyMs?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}): UsageRecord {
  const record: UsageRecord = {
    id: generateRecordId(),
    timestamp: new Date(),
    ...params,
  };

  buffer.push(record);

  // 更新月度计数器
  const key = getMonthKey(params.tenantId);
  monthlyCounters.set(key, (monthlyCounters.get(key) ?? 0) + 1);

  // 记录指标
  void trackMetric('usage.request', 1, {
    tenantId: params.tenantId,
    type: params.type,
    success: String(params.success),
    provider: params.provider ?? 'unknown',
  });

  // 缓冲区过大时立即 Flush
  if (buffer.length >= MAX_BUFFER_SIZE) {
    void flushToWebhook();
  }

  return record;
}

/**
 * 检查配额并返回配额状态
 */
export function checkQuota(
  tenantId: string,
  merchantId: string,
  maxRequestsPerMonth: number
): QuotaStatus {
  const key = getMonthKey(tenantId);
  const used = monthlyCounters.get(key) ?? 0;
  const remaining = Math.max(0, maxRequestsPerMonth - used);
  const usageRatio = maxRequestsPerMonth > 0 ? used / maxRequestsPerMonth : 0;

  const status: QuotaStatus = {
    tenantId,
    usedRequestsThisMonth: used,
    maxRequestsPerMonth,
    remainingRequests: remaining,
    usageRatio,
    // 0 means unlimited, so never exceeded
    isExceeded: maxRequestsPerMonth > 0 && used >= maxRequestsPerMonth,
    isNearLimit: maxRequestsPerMonth > 0 && usageRatio >= 0.8,
    resetAt: getMonthResetDate(),
  };

  if (status.isExceeded) {
    logWarn('Quota exceeded', {
      tenantId,
      merchantId,
      used,
      max: maxRequestsPerMonth,
    });
  } else if (status.isNearLimit) {
    logWarn('Quota near limit', {
      tenantId,
      merchantId,
      used,
      max: maxRequestsPerMonth,
      usageRatio: `${(usageRatio * 100).toFixed(1)}%`,
    });
  }

  return status;
}

/**
 * 断言配额未超限，超限时抛出错误
 */
export function assertQuotaNotExceeded(
  tenantId: string,
  merchantId: string,
  maxRequestsPerMonth: number
): QuotaStatus {
  const status = checkQuota(tenantId, merchantId, maxRequestsPerMonth);

  if (status.isExceeded) {
    throw new Error(
      `Monthly quota exceeded for tenant '${tenantId}'. ` +
        `Used: ${status.usedRequestsThisMonth}/${maxRequestsPerMonth}. ` +
        `Resets at: ${status.resetAt.toISOString()}`
    );
  }

  return status;
}

// ──────────────────────────────────────────────
// 统计汇总
// ──────────────────────────────────────────────

/**
 * 生成指定租户在时间区间内的用量汇总
 */
export function summarizeUsage(
  tenantId: string,
  merchantId: string,
  periodStart: Date,
  periodEnd: Date
): UsageSummary {
  const records = buffer.filter(
    (r) => r.tenantId === tenantId && r.timestamp >= periodStart && r.timestamp <= periodEnd
  );

  const byType: Partial<Record<UsageEventType, number>> = {};
  const byProvider: Record<string, number> = {};
  let totalTokens = 0;
  let totalLatency = 0;
  let successCount = 0;

  for (const r of records) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
    if (r.provider) {
      byProvider[r.provider] = (byProvider[r.provider] ?? 0) + 1;
    }
    if (r.tokensUsed) totalTokens += r.tokensUsed;
    if (r.latencyMs) totalLatency += r.latencyMs;
    if (r.success) successCount++;
  }

  return {
    tenantId,
    merchantId,
    periodStart,
    periodEnd,
    totalRequests: records.length,
    successRequests: successCount,
    failedRequests: records.length - successCount,
    totalTokensUsed: totalTokens,
    avgLatencyMs: records.length > 0 ? totalLatency / records.length : 0,
    byType,
    byProvider,
  };
}

// ──────────────────────────────────────────────
// Flush 机制
// ──────────────────────────────────────────────

/**
 * 将缓冲区数据推送到 Webhook
 */
export async function flushToWebhook(): Promise<FlushResult> {
  if (buffer.length === 0) {
    return { flushed: 0, failed: 0, destination: 'webhook' };
  }

  const toFlush = buffer.splice(0, buffer.length);
  const webhookUrl = process.env.USAGE_WEBHOOK_URL;

  if (!webhookUrl) {
    // 降级：输出到 console
    logEvent('Usage flush (console fallback)', { count: toFlush.length });
    return { flushed: toFlush.length, failed: 0, destination: 'console' };
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: toFlush, flushedAt: new Date().toISOString() }),
    });

    logEvent('Usage flushed to webhook', {
      count: toFlush.length,
      webhook: webhookUrl,
    });

    return { flushed: toFlush.length, failed: 0, destination: 'webhook' };
  } catch (err) {
    logError('Usage flush failed, re-queuing records', err, { count: toFlush.length });
    // 失败的记录重新放回缓冲区头部
    buffer.unshift(...toFlush);
    return { flushed: 0, failed: toFlush.length, destination: 'webhook' };
  }
}

/**
 * 启动定时 Flush
 */
export function startUsageFlush(intervalMs: number = DEFAULT_FLUSH_INTERVAL_MS): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    void flushToWebhook();
  }, intervalMs);
  logEvent('Usage flush scheduler started', { intervalMs });
}

/**
 * 停止定时 Flush
 */
export function stopUsageFlush(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
    logEvent('Usage flush scheduler stopped');
  }
}

/** 获取当前缓冲区大小（用于测试/监控） */
export function getBufferSize(): number {
  return buffer.length;
}

/** 清空所有状态（仅用于测试） */
export function resetUsageTracker(): void {
  buffer.length = 0;
  monthlyCounters.clear();
  stopUsageFlush();
}

/** 直接查询月度用量（无需 Flush） */
export function getMonthlyUsage(tenantId: string): number {
  return monthlyCounters.get(getMonthKey(tenantId)) ?? 0;
}
