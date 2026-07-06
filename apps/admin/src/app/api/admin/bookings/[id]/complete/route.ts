import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { requireAdminSession } from '@/lib/admin-auth';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchantId = getMerchantId();

  try {
    const booking = await prisma.booking.findFirst({
      where: { id: params.id, merchantId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json({ booking: { id: booking.id, status: booking.status } });
    }

    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot complete booking with status ${booking.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status: 'COMPLETED' },
    });

    return NextResponse.json({
      booking: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error('[POST /api/admin/bookings/[id]/complete]', error);
    return NextResponse.json({ error: 'Failed to complete booking' }, { status: 500 });
  }
}
