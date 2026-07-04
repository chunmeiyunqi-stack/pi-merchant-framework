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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const merchantId = getMerchantId();

    const existing = await prisma.service.findFirst({
      where: { id: params.id, merchantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...(body.title != null && { title: String(body.title) }),
        ...(body.description != null && { description: String(body.description) }),
        ...(body.price != null && { price: Number(body.price) }),
        ...(body.durationMinutes != null && { durationMinutes: Number(body.durationMinutes) }),
        ...(body.type != null && { type: body.type as ServiceType }),
        ...(body.status != null && { status: body.status as ServiceStatus }),
      },
    });

    return NextResponse.json({ service: serializeService(service) });
  } catch (error) {
    console.error('[PUT /api/admin/services/[id]]', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!requireAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const merchantId = getMerchantId();

    const existing = await prisma.service.findFirst({
      where: { id: params.id, merchantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const status = body.status as ServiceStatus | undefined;
    if (!status || !['ACTIVE', 'INACTIVE', 'DRAFT'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ service: serializeService(service) });
  } catch (error) {
    console.error('[PATCH /api/admin/services/[id]]', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
