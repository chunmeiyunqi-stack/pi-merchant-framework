import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { merchantId, customerId, serviceId, amount, note } = body;

    // Optional: add your basic validation
    if (!merchantId || !customerId || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate a unique order No
    const orderNo = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const order = await prisma.order.create({
      data: {
        merchantId,
        customerId,
        serviceId: serviceId || null,
        orderNo,
        amount,
        currency: 'PI',
        status: 'PENDING_PAYMENT',
        note: note || '',
      },
    });

    return NextResponse.json({ 
      success: true, 
      orderNo: order.orderNo, 
      amount: order.amount, 
      orderId: order.id 
    });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
