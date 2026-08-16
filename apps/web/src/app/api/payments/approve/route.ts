import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { PrismaClient } from '@prisma/client';
import { withMetrics } from '@/lib/metrics-middleware';
import { acquireLock, releaseLock } from '@/lib/lock';

const prisma = new PrismaClient();

async function __POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, orderId } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Missing paymentId' }, { status: 400 });
    }

    // 1. 分布式锁防护: 确保并发回调/并发点击场景下只有一个线程进行处理
    const lockKey = `lock:payment:approve:${paymentId}`;
    const lockRes = await acquireLock(lockKey, 30);

    if (!lockRes.acquired) {
      if (lockRes.isProdMissingRedis) {
        return NextResponse.json(
          {
            success: false,
            code: 503,
            error:
              lockRes.errorReason ||
              'Payment processing unavailable due to missing distributed lock in production',
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Concurrent approval request in progress' },
        { status: 409 }
      );
    }

    try {
      // 2. 幂等策略 + Prisma Transaction
      await prisma.$transaction(async (tx) => {
        const existingPayment = await tx.payment.findUnique({
          where: { piPaymentId: paymentId },
        });

        if (!existingPayment && orderId) {
          const order = await tx.order.findUnique({ where: { orderNo: orderId } });
          if (order) {
            await tx.payment.create({
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
            await tx.order.update({
              where: { id: order.id },
              data: { status: 'PENDING_APPROVAL', paymentId: paymentId },
            });
          }
        }
      });

      // 3. 向 Pi 官方 Platform API 发送 Approve 请求
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
        if (!errText.includes('already approved')) {
          return NextResponse.json(
            { success: false, error: `Pi API Error: ${errText}` },
            { status: 502 }
          );
        }
      }

      return NextResponse.json({ success: true });
    } finally {
      if (lockRes.lockValue) {
        await releaseLock(lockKey, lockRes.lockValue);
      }
    }
  } catch (error: unknown) {
    console.error('[POST /api/payments/approve] 审批异常:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Server error', {
      status: 500,
    });
  }
}

export const POST = withMetrics(__POST);
