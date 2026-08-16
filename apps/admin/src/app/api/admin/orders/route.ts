export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { withMetrics } from '@/lib/metrics-middleware';
import { apiSuccess, apiError, getTraceId } from '@/lib/api-response';

async function __GET(req: Request) {
  const traceId = getTraceId(req);
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) {
    return apiError('未登录或会话已过期', 401, 401, traceId);
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam))) : 10;

  const merchantId = getMerchantId(req);
  const where: any = { merchantId };

  if (statusParam && statusParam !== 'ALL') {
    where.status = statusParam as any;
  }

  try {
    const total = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { username: true } },
        service: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return apiSuccess(
      {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      '获取订单列表成功',
      200,
      traceId
    );
  } catch (err) {
    return apiError('获取订单列表数据库操作失败', 500, 500, traceId, err);
  }
}

export const GET = withMetrics(__GET);
