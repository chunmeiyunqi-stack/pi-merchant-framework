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
    const { paymentId, orderId } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Missing paymentId' }, { status: 400 });
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

    // ── 1. 幂等策略：检查数据库状态 ───────────────────────
    const existingPayment = await prisma.payment.findUnique({
      where: { piPaymentId: paymentId },
    });

    if (!existingPayment) {
      const order = await prisma.order.findUnique({ where: { orderNo: orderId } });
      if (order) {
        await prisma.$transaction([
          prisma.payment.create({
            data: {
              orderId: order.id,
              piPaymentId: paymentId,
              amount: order.amount,
              status: 'PENDING',
              developerApproved: true,
              approvedAt: new Date(),
              memo: `Payment for order ${order.orderNo}`,
            },
          }),
          prisma.order.update({
            where: { id: order.id },
            data: { status: 'PENDING_APPROVAL', paymentId: paymentId },
          }),
        ]);
      }
    }

    // ── 2. 向 Pi Platform 发送 Approve ─────────────────────
    const piRes = await fetch(`${piApiBase}/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Key ${apiKey}` },
    });

    if (!piRes.ok) {
      const errText = await piRes.text();
      console.error('[Pi API] Approve Failed:', piRes.status, errText);
      if (!errText.includes('already approved')) {
        return NextResponse.json(
          { success: false, error: `Pi API Error: ${errText}` },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[POST /api/payments/approve] Exception:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withMetrics(__POST);
