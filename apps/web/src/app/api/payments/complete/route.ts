import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { PrismaClient } from '@prisma/client';
import { withMetrics } from '@/lib/metrics-middleware';
import { acquireLock, releaseLock } from '@/lib/lock';

const prisma = new PrismaClient();

async function __POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // 1. 分布式锁防护: 确保并发回调/完结接口只有一个线程处理
    const lockKey = `lock:payment:complete:${paymentId}`;
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
        { success: false, error: 'Concurrent completion request in progress' },
        { status: 409 }
      );
    }

    try {
      // 2. 向 Pi 官方服务器发送 Complete 请求，完成链路闭环
      const piApiBase = process.env.PI_PLATFORM_API_BASE || 'https://api.minepi.com';
      const apiKey = process.env.PI_API_KEY;

      if (!apiKey) {
        console.error('[Pi API] Missing PI_API_KEY in environment variables');
        return NextResponse.json({ success: false, error: 'Missing PI_API_KEY' }, { status: 500 });
      }

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

      const payment = await prisma.payment.findUnique({
        where: { piPaymentId: paymentId },
        include: { order: true },
      });

      if (!payment || payment.status === 'COMPLETED') {
        // 幂等边界，已完成则直接放行
        return NextResponse.json({ success: true, message: 'Already completed locally' });
      }

      // 3. 事务操作：更新 DB 状态与权益履约
      await prisma.$transaction(async (tx: any) => {
        await tx.payment.update({
          where: { piPaymentId: paymentId },
          data: {
            txid: txid,
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
            endAt: endAt,
            status: 'ACTIVE',
          },
        });
      });

      return NextResponse.json({ success: true });
    } finally {
      if (lockRes.lockValue) {
        await releaseLock(lockKey, lockRes.lockValue);
      }
    }
  } catch (error: unknown) {
    console.error('[POST /api/payments/complete] 完成支付异常:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Server error', {
      status: 500,
    });
  }
}

export const POST = withMetrics(__POST);
