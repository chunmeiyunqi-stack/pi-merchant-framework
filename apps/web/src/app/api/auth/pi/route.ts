import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { signSessionToken } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { piUid, username, merchantId } = body;

    if (!piUid || !username || !merchantId) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters: piUid, username, merchantId' },
        { status: 400 }
      );
    }

    // Upsert Customer
    const customer = await prisma.customer.upsert({
      where: {
        merchantId_piUid: {
          merchantId: merchantId,
          piUid: piUid,
        },
      },
      update: {
        username: username,
      },
      create: {
        merchantId: merchantId,
        piUid: piUid,
        username: username,
      },
    });
    
    // Set secure HTTP-only cookie with SIGNED opaque token
    const secureToken = signSessionToken(piUid);
    const cookieStore = cookies();
    cookieStore.set('pi_auth_token', secureToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({ 
      success: true,
      user: { uid: piUid, username: username }
    });
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
