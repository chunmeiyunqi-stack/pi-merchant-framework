import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { withMetrics } from '@/lib/metrics-middleware';

const prisma = new PrismaClient();

async function __GET(req: Request) {
  const cookieStore = cookies();
  let token = cookieStore.get('pi_auth_token')?.value;

  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const piUid = verifySessionToken(token);
  if (!piUid) {
    return NextResponse.json({ authenticated: false });
  }

  const customer = await prisma.customer.findFirst({
    where: { piUid },
    select: { username: true },
  });

  if (!customer) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, username: customer.username });
}

export const GET = withMetrics(__GET);
