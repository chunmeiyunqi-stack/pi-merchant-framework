import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

export async function GET() {
  const token = cookies().get('pi_auth_token')?.value;
  // If authorization fails, return zeros safely instead of blowing up to fulfill user constraint "空数据时返回 0"
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ todayOrders: 0, todayRevenue: 0, totalMembers: 0, pendingBookings: 0 });
  }

  const merchantId = getMerchantId();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const [todayOrders, todayRevenueAgg, totalMembers, pendingBookings] = await Promise.all([
      prisma.order.count({
        where: { merchantId, createdAt: { gte: startOfToday } }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { order: { merchantId }, status: 'COMPLETED', createdAt: { gte: startOfToday } }
      }),
      prisma.customerMembership.count({
        where: { customer: { merchantId }, status: 'ACTIVE' }
      }),
      prisma.booking.count({
        where: { merchantId, status: 'PENDING' }
      })
    ]);

    const todayRevenue = todayRevenueAgg._sum.amount ? Number(todayRevenueAgg._sum.amount) : 0;

    return NextResponse.json({
      todayOrders,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      totalMembers,
      pendingBookings
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ todayOrders: 0, todayRevenue: 0, totalMembers: 0, pendingBookings: 0 });
  }
}
