// --- 文件: packages/pi-sdk/src/usage/types.ts ---
```typescript
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
```


// --- 文件: packages/pi-sdk/src/usage/tracker.ts ---
```typescript
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
```


// --- 文件: apps/web/src/app/api/tenant/[tenantId]/usage/route.ts ---
```typescript
// apps/web/src/app/api/tenant/[tenantId]/usage/route.ts
// 租户用量查询 API 端点

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkQuota, getTenantById, getMonthlyUsage, summarizeUsage } from '@pi-merchant/pi-sdk';
import { verifySessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { tenantId: string };
}

/**
 * GET /api/tenant/[tenantId]/usage
 * 查询指定租户的用量统计和配额状态
 */
export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  // 鉴权
  const cookieStore = cookies();
  const token = cookieStore.get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tenantId } = params;

  try {
    const tenant = getTenantById(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: `Tenant '${tenantId}' not found` }, { status: 404 });
    }

    // 解析时间区间（默认：本月）
    const url = new URL(request.url);
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');
    const periodStart = startParam ? new Date(startParam) : defaultStart;
    const periodEnd = endParam ? new Date(endParam) : now;

    // 用量汇总
    const summary = summarizeUsage(tenantId, tenant.merchantId, periodStart, periodEnd);

    // 配额状态
    const maxPerMonth = tenant.quota?.maxRequestsPerMonth ?? 0;
    const quota = checkQuota(tenantId, tenant.merchantId, maxPerMonth);

    // 实时月度用量（直接从计数器读取）
    const monthlyUsage = getMonthlyUsage(tenantId);

    return NextResponse.json({
      tenantId,
      tenantName: tenant.name,
      tier: tenant.tier,
      status: tenant.status,
      summary,
      quota: {
        ...quota,
        resetAt: quota.resetAt.toISOString(),
      },
      monthlyUsage,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```


// --- 文件: apps/web/src/app/api/payments/approve/route.ts ---
```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, orderId } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Missing paymentId' }, { status: 400 });
    }

    // 1. 幂等策略: 检查数据库状态
    const existingPayment = await prisma.payment.findUnique({
      where: { piPaymentId: paymentId },
    });

    if (!existingPayment) {
      const order = await prisma.order.findUnique({ where: { orderNo: orderId } });
      if (order) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            piPaymentId: paymentId,
            amount: order.amount,
            status: 'PENDING',
            developerApproved: true,
            approvedAt: new Date(),
            memo: `Paying for order ${order.orderNo}`,
          },
        });
        await prisma.order.update({ where: { id: order.id }, data: { status: 'PENDING_APPROVAL', paymentId: paymentId } });
      }
    }

    // 2. 极其关键：必须向 Pi 官方服务器发送 Approve 请求，否则 SDK 会死锁！
    const piApiBase = process.env.PI_PLATFORM_API_BASE || 'https://api.minepi.com';
    const apiKey = process.env.PI_API_KEY;

    if (!apiKey) {
      console.error('[Pi API] Missing PI_API_KEY in environment variables');
      return NextResponse.json({ success: false, error: 'Missing PI_API_KEY' }, { status: 500 });
    }

    const piRes = await fetch(`${piApiBase}/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    });

    if (!piRes.ok) {
      const errText = await piRes.text();
      console.error('[Pi API] Approve Failed:', piRes.status, errText);
      // 如果 Pi 报错说已经 approve 过了，可以放行
      if (!errText.includes('already approved')) {
        return NextResponse.json({ success: false, error: `Pi API Error: ${errText}` }, { status: 502 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[POST /api/payments/approve] 审批异常:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Server error', {
      status: 500,
    });
  }
}
```
