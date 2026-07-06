import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMetrics } from '@/lib/metrics-middleware';
import { getMerchantId } from '@/lib/utils';

async function __GET(_req: Request, { params }: { params: { id: string } }) {
  const merchantId = getMerchantId();

  try {
    const service = await prisma.service.findFirst({
      where: { id: params.id, merchantId, status: 'ACTIVE' },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({
      service: {
        id: service.id,
        type: service.type,
        title: service.title,
        description: service.description ?? '',
        price: Number(service.price),
        durationMinutes: service.durationMinutes,
        status: service.status,
      },
    });
  } catch (error) {
    console.error('[GET /api/services/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withMetrics(__GET);
