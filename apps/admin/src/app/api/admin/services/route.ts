import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { requireAdminSession } from '@/lib/admin-auth';
import type { ServiceStatus, ServiceType } from '@prisma/client';

function serializeService(service: {
  id: string;
  type: ServiceType;
  title: string;
  description: string | null;
  price: { toNumber?: () => number } | number;
  durationMinutes: number | null;
  status: ServiceStatus;
  createdAt: Date;
}) {
  return {
    id: service.id,
    type: service.type,
    title: service.title,
    description: service.description ?? '',
    price: Number(service.price),
    durationMinutes: service.durationMinutes ?? 0,
    status: service.status,
    createdAt: service.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  if (!requireAdminSession()) {
    return NextResponse.json({ services: [], pagination: null });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50));
  const merchantId = getMerchantId();

  try {
    const where = { merchantId };
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
    console.error('[GET /api/admin/services]', error);
    return NextResponse.json({ services: [], pagination: null });
  }
}

export async function POST(req: Request) {
  if (!requireAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, price, durationMinutes, type } = body;

    if (!title || price == null) {
      return NextResponse.json({ error: 'title and price are required' }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        merchantId: getMerchantId(),
        title: String(title),
        description: description ? String(description) : null,
        price: Number(price),
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        type: (type as ServiceType) ?? 'SERVICE',
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ service: serializeService(service) }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/services]', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
