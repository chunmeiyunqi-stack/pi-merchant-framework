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
  const token = cookieStore.get('pi_session')?.value;
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
