import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { withMetrics } from '@/lib/metrics-middleware';
import { getMerchantId } from '@/lib/utils';

function serializeService(service: {
  id: string;
  type: string;
  title: string;
  description: string | null;
  price: { toNumber?: () => number } | number;
  durationMinutes: number | null;
  status: string;
}) {
  return {
    id: service.id,
    type: service.type,
    title: service.title,
    description: service.description ?? '',
    price: Number(service.price),
    durationMinutes: service.durationMinutes,
    status: service.status,
  };
}

async function __GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
  const merchantId = getMerchantId();

  try {
    const where = { merchantId, status: 'ACTIVE' as const };
    const total = await prisma.service.count({ where });
    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      services: services.map(serializeService),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error('[GET /api/services]', error);
    return NextResponse.json({ services: [], pagination: null }, { status: 500 });
  }
}

export const GET = withMetrics(__GET);
