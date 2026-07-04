import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { requireAdminSession } from '@/lib/admin-auth';
import type { BookingStatus } from '@prisma/client';

export async function GET(req: Request) {
  if (!requireAdminSession()) {
    return NextResponse.json({ bookings: [], pagination: null });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
  const merchantId = getMerchantId();

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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('[GET /api/admin/bookings]', error);
    return NextResponse.json({ bookings: [], pagination: null });
  }
}
