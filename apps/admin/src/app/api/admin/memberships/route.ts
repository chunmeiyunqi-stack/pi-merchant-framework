export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { withMetrics } from '@/lib/metrics-middleware';
import { apiSuccess, apiError, getTraceId } from '@/lib/api-response';

async function __GET(req: Request) {
  const traceId = getTraceId(req);
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) {
    return apiError('未登录或凭证失效', 401, 401, traceId);
  }

  const merchantId = getMerchantId(req);
  try {
    const memberships = await prisma.membership.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess({ memberships }, '获取会员卡列表成功', 200, traceId);
  } catch (err) {
    return apiError('获取会员卡列表失败', 500, 500, traceId, err);
  }
}

export const GET = withMetrics(__GET);

async function __POST(req: Request) {
  const traceId = getTraceId(req);
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) {
    return apiError('未授权操作', 401, 401, traceId);
  }

  const merchantId = getMerchantId(req);
  try {
    const body = await req.json();
    if (!body.name || body.price == null || !body.mode) {
      return apiError('名称 (name)、价格 (price) 和模式 (mode) 为必填项', 400, 400, traceId);
    }

    const newMembership = await prisma.membership.create({
      data: {
        merchantId,
        name: body.name,
        mode: body.mode,
        price: body.price,
        validDays: body.validDays ? Number(body.validDays) : null,
        totalUses: body.totalUses ? Number(body.totalUses) : null,
        status: 'ACTIVE',
      },
    });
    return apiSuccess({ membership: newMembership }, '创建会员卡规格成功', 201, traceId);
  } catch (e: unknown) {
    return apiError('创建会员卡规格失败', 500, 500, traceId, e);
  }
}

export const POST = withMetrics(__POST);
