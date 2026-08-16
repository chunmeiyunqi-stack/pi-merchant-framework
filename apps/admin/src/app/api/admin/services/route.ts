export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { requireAdminSession } from '@/lib/admin-auth';
import type { ServiceStatus, ServiceType } from '@prisma/client';
import { apiSuccess, apiError, getTraceId } from '@/lib/api-response';

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
  const traceId = getTraceId(req);
  if (!requireAdminSession()) {
    return apiError('未登录或会话凭证失效', 401, 401, traceId);
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50));
  const merchantId = getMerchantId(req);

  try {
    const where = { merchantId };
    const total = await prisma.service.count({ where });
    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return apiSuccess(
      {
        services: services.map(serializeService),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
      '获取服务列表成功',
      200,
      traceId
    );
  } catch (error) {
    return apiError('获取服务列表数据库操作异常', 500, 500, traceId, error);
  }
}

export async function POST(req: Request) {
  const traceId = getTraceId(req);
  if (!requireAdminSession()) {
    return apiError('未授权操作', 401, 401, traceId);
  }

  try {
    const body = await req.json();
    const { title, description, price, durationMinutes, type } = body;

    if (!title || price == null) {
      return apiError('服务标题 (title) 和价格 (price) 为必填项', 400, 400, traceId);
    }

    const service = await prisma.service.create({
      data: {
        merchantId: getMerchantId(req),
        title: String(title),
        description: description ? String(description) : null,
        price: Number(price),
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        type: (type as ServiceType) ?? 'SERVICE',
        status: 'ACTIVE',
      },
    });

    return apiSuccess({ service: serializeService(service) }, '创建服务成功', 201, traceId);
  } catch (error) {
    return apiError('创建服务失败，请重试', 500, 500, traceId, error);
  }
}
