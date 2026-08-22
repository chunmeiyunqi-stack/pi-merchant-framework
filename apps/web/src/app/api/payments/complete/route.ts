import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { withMetrics } from '@/lib/metrics-middleware';
import { piPlatformBase } from '@/lib/pi-platform';

async function __POST(req: Request) {
  try {
    // ── 身份验证 ──────────────────────────────────────────
    const cookieStore = cookies();
    let token = cookieStore.get('pi_auth_token')?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    if (!token || !verifySessionToken(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { success: false, error: 'Missing paymentId or txid' },
        { status: 400 }
      );
    }

    // ── 环境变量校验 ──────────────────────────────────────
    const piApiBase = piPlatformBase();
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error('[Pi API] CRITICAL: Missing PI_API_KEY');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: PI_API_KEY not set' },
        { status: 500 }
      );
    }

    // ── 查找支付记录 ─────────────────────────────────────
    const payment = await prisma.payment.findUnique({
      where: { piPaymentId: paymentId },
      include: { order: true },
    });

    // ── 1. 向 Pi Platform 发送 Complete ────────────────────
    const piRes = await fetch(`${piApiBase}/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({ txid }),
    });

    if (!piRes.ok) {
      const errText = await piRes.text();
      console.error('[Pi API] Complete Failed:', piRes.status, errText);
      if (!errText.includes('already completed')) {
        return NextResponse.json(
          { success: false, error: `Pi API Error: ${errText}` },
          { status: 502 }
        );
      }
    }

    // ── 2. 幂等边界 ──────────────────────────────────────
    if (!payment || payment.status === 'COMPLETED') {
      return NextResponse.json({ success: true, message: 'Already completed' });
    }

    // ── 3. 事务更新本地数据库 ────────────────────────────
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { piPaymentId: paymentId },
        data: {
          txid,
          status: 'COMPLETED',
          transactionVerified: true,
          developerCompleted: true,
          completedAt: new Date(),
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'COMPLETED' },
      });

      const durationDays = 30;
      let dbMembership = await tx.membership.findFirst({
        where: { merchantId: updatedOrder.merchantId },
      });

      if (!dbMembership) {
        dbMembership = await tx.membership.create({
          data: {
            merchantId: updatedOrder.merchantId,
            name: 'AI Framework Subscription',
            mode: 'TIME_BASED',
            price: 0,
          },
        });
      }

      const endAt = new Date();
      endAt.setDate(endAt.getDate() + durationDays);

      await tx.customerMembership.create({
        data: {
          customerId: updatedOrder.customerId,
          membershipId: dbMembership.id,
          startAt: new Date(),
          endAt,
          status: 'ACTIVE',
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[POST /api/payments/complete] Exception:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withMetrics(__POST);
