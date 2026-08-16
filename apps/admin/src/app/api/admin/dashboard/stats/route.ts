export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { apiSuccess, apiError, getTraceId } from '@/lib/api-response';

export async function GET(req: Request) {
  const traceId = getTraceId(req);
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) {
    return apiError('未登录或凭证失效', 401, 401, traceId);
  }

  const merchantId = getMerchantId(req);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const [
      todayOrders,
      todayRevenueAgg,
      totalMembers,
      pendingBookings,
      activeServices,
      pendingPayments,
      activeMemberships,
    ] = await Promise.all([
      prisma.order.count({
        where: { merchantId, createdAt: { gte: startOfToday } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { order: { merchantId }, status: 'COMPLETED', createdAt: { gte: startOfToday } },
      }),
      prisma.customer.count({
        where: { merchantId },
      }),
      prisma.booking.count({
        where: { merchantId, status: 'PENDING' },
      }),
      prisma.service.count({
        where: { merchantId, status: 'ACTIVE' },
      }),
      prisma.payment.count({
        where: { status: 'PENDING', order: { merchantId } },
      }),
      prisma.customerMembership.count({
        where: { customer: { merchantId }, status: 'ACTIVE' },
      }),
    ]);

    const todayRevenue = todayRevenueAgg._sum.amount ? Number(todayRevenueAgg._sum.amount) : 0;

    return apiSuccess(
      {
        stats: {
          todayOrders,
          todayRevenue: Number(todayRevenue.toFixed(2)),
          totalMembers,
          pendingBookings,
          activeServices,
          pendingPayments,
          activeMemberships,
        },
      },
      '获取统计数据成功',
      200,
      traceId
    );
  } catch (error) {
    return apiError('获取统计数据失败', 500, 500, traceId, error);
  }
}
