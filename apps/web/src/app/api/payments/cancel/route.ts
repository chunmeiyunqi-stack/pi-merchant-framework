// ============================================================
// POST /api/payments/cancel
// 取消支付（用户取消或系统超时取消）
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { paymentId?: string };
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'paymentId 不能为空' }, { status: 400 });
    }

    // 更新支付记录状态
    await prisma.payment.updateMany({
      where: { piPaymentId: paymentId },
      data: {
        status: 'CANCELLED',
        userCancelled: true,
      },
    });

    // 更新关联订单
    const payment = await prisma.payment.findUnique({
      where: { piPaymentId: paymentId },
      select: { orderId: true },
    });

    if (payment?.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CANCELLED' },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[/api/payments/cancel] 内部错误:', err);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
