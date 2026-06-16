import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { withMetrics } from '@/lib/metrics-middleware';

async function __GET() {
  const merchantId = getMerchantId();
  try {
    const memberships = await prisma.membership.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ memberships });
  } catch {
    return NextResponse.json({ memberships: [] });
  }
}

export const GET = withMetrics(__GET);

async function __POST(req: Request) {
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token))
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const merchantId = getMerchantId();
  try {
    const body = await req.json();
    const newMembership = await prisma.membership.create({
      data: {
        merchantId,
        name: body.name,
        mode: body.mode,
        price: body.price,
        validDays: body.validDays || null,
        totalUses: body.totalUses || null,
        status: 'ACTIVE',
      },
    });
    return NextResponse.json({ success: true, data: newMembership });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const POST = withMetrics(__POST);
