import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, txid, orderId } = body;

    if (!paymentId || !txid || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: paymentId, txid, orderId' }, 
        { status: 400 }
      );
    }

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      throw new Error('PI_API_KEY environment variable is not configured');
    }

    // Call Pi API to execute the completion
    const piRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${piApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid })
    });

    if (!piRes.ok) {
        const errData = await piRes.text();
        console.error('Pi API Complete Error:', errData);
        throw new Error(`Failed to complete payment on Pi Platform: ${piRes.status}`);
    }

    await prisma.$transaction(async (tx) => {
      // Update payment to final completed status
      await tx.payment.update({
        where: { piPaymentId: paymentId },
        data: {
          txid: txid,
          status: 'COMPLETED',
          developerCompleted: true,
          completedAt: new Date(),
        }
      });

      // Update associated order to completed
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment Complete Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
