import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, orderId } = body;

    if (!paymentId || !orderId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNo: orderId }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // 幂等策略: Check if payment id is already stored to prevent duplicate insertion
    const existingPayment = await prisma.payment.findUnique({
      where: { piPaymentId: paymentId }
    });

    if (existingPayment) {
        return NextResponse.json({ success: true });
    }

    // Create pending payment link
    await prisma.payment.create({
      data: {
        orderId: order.id,
        piPaymentId: paymentId,
        amount: order.amount,
        status: 'PENDING',
        developerApproved: true,
        approvedAt: new Date(),
        memo: `Paying for order ${order.orderNo}`
      }
    });

    // Mark order as pending approval
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PENDING_APPROVAL', paymentId: paymentId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment Approve Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
