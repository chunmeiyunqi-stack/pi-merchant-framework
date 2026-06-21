// ============================================================
// Pioneer AI Framework — GET /api/v1/history
// 查询当前用户的 AI 生成历史记录
// ============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { withMetrics } from '@/lib/metrics-middleware';
import { runWithTenant } from '@pi-merchant/pi-sdk';

export const dynamic = 'force-dynamic';

// Type alias for the GenerationHistory model - Prisma Client may not have generated yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = typeof prisma & { generationHistory: any };

async function __GET(req: Request) {
  // Verify authentication - verifySessionToken returns piUid string or null
  const token = cookies().get('pi_auth_token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const piUid = verifySessionToken(token);
  if (!piUid) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const type = searchParams.get('type'); // 'TEXT' | 'IMAGE' | 'VIDEO'
    const skip = (page - 1) * limit;

    // merchantId 只从服务端配置读取，不接受任何客户端传入的 tenant 声明，
    // 防止通过 x-tenant-id 头部或 merchant_id Cookie 进行跨租户数据越权访问（IDOR）。
    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID ?? 'merchant-demo-001';

    // Build filter - piUid is the actual Pi User ID decoded from the session token
    const where = {
      merchantId,
      piUid,
      ...(type && ['TEXT', 'IMAGE', 'VIDEO'].includes(type)
        ? { type: type as 'TEXT' | 'IMAGE' | 'VIDEO' }
        : {}),
    };

    const db = prisma as AnyPrisma;

    // 在租户上下文中执行查询，Prisma 中间件将自动强制 merchantId 过滤
    return runWithTenant(merchantId, async () => {
      const [items, total] = await Promise.all([
        db.generationHistory.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            type: true,
            provider: true,
            model: true,
            prompt: true,
            response: true,
            imageUrl: true,
            videoUrl: true,
            promptTokens: true,
            completionTokens: true,
            totalTokens: true,
            durationMs: true,
            status: true,
            createdAt: true,
          },
        }),
        db.generationHistory.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch history';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const GET = withMetrics(__GET);
