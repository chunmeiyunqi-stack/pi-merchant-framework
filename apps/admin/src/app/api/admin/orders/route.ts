import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

export async function GET() {
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) return NextResponse.json({ orders: [] });

  const merchantId = getMerchantId();
  try {
    const orders = await prisma.order.findMany({
      where: { merchantId },
      include: {
        customer: { select: { username: true } },
        service: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Hard limit for safety in MVP bounds
    });
    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ orders: [] });
  }
}
