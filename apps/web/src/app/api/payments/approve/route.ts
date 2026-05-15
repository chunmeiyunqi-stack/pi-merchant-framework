import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, orderId } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Missing paymentId' }, { status: 400 });
    }

    // 1. 幂等策略: 检查数据库状态
    const existingPayment = await prisma.payment.findUnique({
      where: { piPaymentId: paymentId },
    });

    if (!existingPayment) {
      const order = await prisma.order.findUnique({ where: { orderNo: orderId } });
      if (order) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            piPaymentId: paymentId,
            amount: order.amount,
            status: 'PENDING',
            developerApproved: true,
            approvedAt: new Date(),
            memo: `Paying for order ${order.orderNo}`,
          },
        });
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'PENDING_APPROVAL', paymentId: paymentId },
        });
      }
    }

    // 2. 极其关键：必须向 Pi 官方服务器发送 Approve 请求，否则 SDK 会死锁！
    const piApiBase = process.env.PI_PLATFORM_API_BASE || 'https://api.minepi.com';
    const apiKey = process.env.PI_API_KEY;

    if (!apiKey) {
      console.error('[Pi API] Missing PI_API_KEY in environment variables');
      return NextResponse.json({ success: false, error: 'Missing PI_API_KEY' }, { status: 500 });
    }

    const piRes = await fetch(`${piApiBase}/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    });

    if (!piRes.ok) {
      const errText = await piRes.text();
      console.error('[Pi API] Approve Failed:', piRes.status, errText);
      // 如果 Pi 报错说已经 approve 过了，可以放行
      if (!errText.includes('already approved')) {
        return NextResponse.json(
          { success: false, error: `Pi API Error: ${errText}` },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[POST /api/payments/approve] 审批异常:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Server error', {
      status: 500,
    });
  }
}
