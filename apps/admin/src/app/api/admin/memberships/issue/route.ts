export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { requireAdminSession } from '@/lib/admin-auth';
import { apiSuccess, apiError, getTraceId } from '@/lib/api-response';

export async function POST(req: Request) {
  const traceId = getTraceId(req);
  if (!requireAdminSession()) {
    return apiError('未授权操作', 401, 401, traceId);
  }

  const merchantId = getMerchantId(req);

  try {
    const body = await req.json();
    const { membershipId, customerPiUid, customerUsername } = body;

    if (!membershipId || (!customerPiUid && !customerUsername)) {
      return apiError('请选择会员卡规格并填写客户用户名或 Pi UID', 400, 400, traceId);
    }

    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, merchantId },
    });

    if (!membership) {
      return apiError('指定的会员卡规格不存在', 404, 404, traceId);
    }

    // 查找或创建 Customer
    let customer = await prisma.customer.findFirst({
      where: {
        merchantId,
        OR: [
          { piUid: customerPiUid || 'unspecified' },
          { username: customerUsername || 'unspecified' },
        ],
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          merchantId,
          piUid: customerPiUid || `manual_${Date.now()}`,
          username: customerUsername || `user_${Date.now()}`,
          membershipStatus: 'ACTIVE',
        },
      });
    }

    // 计算有效期与次数
    const startAt = new Date();
    let endAt: Date | null = null;
    if (membership.validDays) {
      endAt = new Date();
      endAt.setDate(endAt.getDate() + membership.validDays);
    }

    const customerMembership = await prisma.customerMembership.create({
      data: {
        customerId: customer.id,
        membershipId: membership.id,
        startAt,
        endAt,
        remainingUses: membership.totalUses || null,
        status: 'ACTIVE',
      },
      include: {
        membership: true,
        customer: true,
      },
    });

    return apiSuccess({ customerMembership }, '会员卡发放成功', 201, traceId);
  } catch (err) {
    return apiError('发放会员卡数据库操作失败', 500, 500, traceId, err);
  }
}
