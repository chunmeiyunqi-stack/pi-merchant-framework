export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { requireAdminSession } from '@/lib/admin-auth';
import type { BookingStatus } from '@prisma/client';
import { apiSuccess, apiError, getTraceId } from '@/lib/api-response';

export async function GET(req: Request) {
  const traceId = getTraceId(req);
  if (!requireAdminSession()) {
    return apiError('未登录或凭证失效', 401, 401, traceId);
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
  const merchantId = getMerchantId(req);

  const where: { merchantId: string; status?: BookingStatus } = { merchantId };
  if (statusParam && statusParam !== 'ALL') {
    where.status = statusParam as BookingStatus;
  }

  try {
    const total = await prisma.booking.count({ where });
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { username: true } },
        service: { select: { title: true } },
      },
      orderBy: { slotStart: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return apiSuccess(
      {
        bookings: bookings.map((b) => ({
          id: b.id,
          slotStart: b.slotStart.toISOString(),
          slotEnd: b.slotEnd.toISOString(),
          status: b.status,
          note: b.note,
          customer: b.customer,
          service: b.service,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
      '获取预约列表成功',
      200,
      traceId
    );
  } catch (error) {
    return apiError('获取预约列表数据库操作异常', 500, 500, traceId, error);
  }
}
