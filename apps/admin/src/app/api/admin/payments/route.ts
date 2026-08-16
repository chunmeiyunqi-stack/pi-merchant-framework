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
    return apiError('未登录或凭证失效', 401, 401, traceId);
  }

  const merchantId = getMerchantId(req);
  try {
    const payments = await prisma.payment.findMany({
      where: { order: { merchantId } },
      include: {
        order: {
          select: {
            orderNo: true,
            customer: { select: { username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return apiSuccess({ payments }, '获取支付流水成功', 200, traceId);
  } catch (err) {
    return apiError('获取支付流水数据库查询失败', 500, 500, traceId, err);
  }
}

export const GET = withMetrics(__GET);
