import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    // Upsert Customer: Create if not exists, otherwise update username
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
    
    // (Optional here: create a secure session/JWT cookie)

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
