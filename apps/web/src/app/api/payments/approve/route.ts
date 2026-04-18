import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, orderId } = body;

    if (!paymentId || !orderId) {
      return NextResponse.json({ success: false, error: 'Missing paymentId or orderId' }, { status: 400 });
    }

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      throw new Error('PI_API_KEY environment variable is not configured');
    }

    // Call Pi API to approve the payment
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!piRes.ok) {
        const errData = await piRes.text();
        console.error('Pi API Approve Error:', errData);
        throw new Error(`Failed to approve payment on Pi Platform: ${piRes.status}`);
    }

    // Run DB sync safely in a transaction
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Order not found');

      // UPSERT payment using piPaymentId to avoid duplicates in edge cases
      await tx.payment.upsert({
        where: { piPaymentId: paymentId },
        create: {
          piPaymentId: paymentId,
          orderId: order.id,
          amount: order.amount,
          status: 'APPROVED',
          developerApproved: true,
          approvedAt: new Date(),
        },
        update: {
          status: 'APPROVED',
          developerApproved: true,
          approvedAt: new Date(),
        }
      });

      // Advance order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'APPROVED' }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment Approve Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
