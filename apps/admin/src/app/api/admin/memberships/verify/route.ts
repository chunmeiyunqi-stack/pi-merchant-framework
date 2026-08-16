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
    const { customerMembershipId, redeemUses = 1 } = body;

    if (!customerMembershipId) {
      return apiError('缺少会员卡记录 ID (customerMembershipId)', 400, 400, traceId);
    }

    const card = await prisma.customerMembership.findFirst({
      where: {
        id: customerMembershipId,
        customer: { merchantId },
      },
      include: {
        membership: true,
        customer: true,
      },
    });

    if (!card) {
      return apiError('未查找到对应的会员卡记录', 404, 404, traceId);
    }

    if (card.status !== 'ACTIVE') {
      return apiError(`该会员卡已被冻结或废弃 (状态: ${card.status})`, 400, 400, traceId);
    }

    // 检查有效期
    if (card.endAt && new Date() > card.endAt) {
      await prisma.customerMembership.update({
        where: { id: card.id },
        data: { status: 'EXPIRED' },
      });
      return apiError('该会员卡已过有效期', 400, 400, traceId);
    }

    // 检查并扣减使用次数
    let newRemaining = card.remainingUses;
    if (newRemaining !== null) {
      if (newRemaining < redeemUses) {
        return apiError(`会员卡剩余可用次数不足 (剩余: ${newRemaining} 次)`, 400, 400, traceId);
      }
      newRemaining = newRemaining - redeemUses;
    }

    const updatedCard = await prisma.customerMembership.update({
      where: { id: card.id },
      data: {
        remainingUses: newRemaining,
        status: newRemaining === 0 ? 'EXPIRED' : 'ACTIVE',
      },
      include: {
        membership: true,
        customer: true,
      },
    });

    return apiSuccess(
      {
        verified: true,
        card: updatedCard,
        redeemedUses: redeemUses,
      },
      '会员卡核销验证成功',
      200,
      traceId
    );
  } catch (err) {
    return apiError('核销会员卡失败', 500, 500, traceId, err);
  }
}
