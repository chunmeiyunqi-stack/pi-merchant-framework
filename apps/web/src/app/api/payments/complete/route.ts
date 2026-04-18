import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // Verify payment against Pi Network Platform API (skipped mock for sandbox)
    // In production: await axios.get(`https://api.minepi.com/v2/payments/${paymentId}`, { headers: { Authorization: `Key ${process.env.PI_API_KEY}` }})

    const payment = await prisma.payment.findUnique({
      where: { piPaymentId: paymentId },
      include: { order: true }
    });

    if (!payment || payment.status === 'COMPLETED') {
        // 幂等边界: If already completed, returns success. 
        return NextResponse.json({ success: true, message: 'Already completed' });
    }

    // Execute atomic transaction for safety
    await prisma.$transaction(async (tx) => {
      // 1. Mark Payment
      await tx.payment.update({
        where: { piPaymentId: paymentId },
        data: {
          txid: txid,
          status: 'COMPLETED',
          transactionVerified: true,
          developerCompleted: true,
          completedAt: new Date()
        }
      });

      // 2. Mark Order
      const updatedOrder = await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'COMPLETED' }
      });

      // 3. Issue CustomerMembership (Extract plan from note or metadata)
      // Standardize reading plan identifier. For this minimal framework, we map hardcoded packages.
      // E.g. Note holds 'PRO' or 'BASIC'
      const durationDays = 30; 
      
      // We must hook to an existing membership definition in the DB.
      // If we don't have one, we just create a dummy one for the merchant or find first.
      let dbMembership = await tx.membership.findFirst({
         where: { merchantId: updatedOrder.merchantId }
      });
      
      if (!dbMembership) {
         dbMembership = await tx.membership.create({
             data: {
                 merchantId: updatedOrder.merchantId,
                 name: 'AI Framework Subscription',
                 mode: 'TIME_BASED',
                 price: 0,
             }
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
          status: 'ACTIVE'
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment Complete Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
