import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('pi_auth_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const piUid = verifySessionToken(token);
  if (!piUid) {
    return NextResponse.json({ authenticated: false });
  }

  const customer = await prisma.customer.findFirst({
    where: { piUid },
    select: { username: true }
  });

  if (!customer) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, username: customer.username });
}
