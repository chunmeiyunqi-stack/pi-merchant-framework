import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

export async function GET(req: Request) {
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) return NextResponse.json({ orders: [], pagination: null });

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam))) : 10;
  
  const merchantId = getMerchantId();
  const where: any = { merchantId };
  
  if (statusParam && statusParam !== 'ALL') {
    where.status = statusParam;
  }

  try {
    const total = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { username: true } },
        service: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    return NextResponse.json({ 
      orders, 
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (e) {
    return NextResponse.json({ orders: [], pagination: null });
  }
}
