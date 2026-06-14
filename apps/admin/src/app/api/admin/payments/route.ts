import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { withMetrics } from '@/lib/metrics-middleware';

async function __GET() {
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) return NextResponse.json({ payments: [] });

  const merchantId = getMerchantId();
  try {
    const payments = await prisma.payment.findMany({
      where: { order: { merchantId } },
      include: {
        order: {
          select: {
            orderNo: true,
            customer: { select: { username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ payments });
  } catch (_e) {
    return NextResponse.json({ payments: [] });
  }
}

export const GET = withMetrics(__GET);
