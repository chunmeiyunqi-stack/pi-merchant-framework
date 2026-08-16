import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { withMetrics } from '@/lib/metrics-middleware';

async function __POST(req: Request) {
  try {
    const cookieStore = cookies();
    let token = cookieStore.get('pi_auth_token')?.value;

    // 如果 Cookie 丢了，尝试从 Authorization 头中读取
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    console.log('[Orders API] Received token:', token ? 'YES (hidden)' : 'NO');

    const piUid = token ? verifySessionToken(token) : null;

    console.log('[Orders API] Verified piUid:', piUid ? piUid : 'FAILED');

    if (!piUid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized (No valid token)' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, memo, planId, orderNo: clientOrderNo } = body;
    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001';

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { merchantId_piUid: { merchantId, piUid } },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // 幂等策略: We could check if there's an existing DRAFT order for this same plan.
    // For simplicity, we just generate a new orderNo. The real deduplication is in the Pi Payment creation.
    // 优先使用前端传入的 orderNo，保证前后端订单号一致（支付 metadata 与审批关联同一订单）
    const orderNo = clientOrderNo ?? `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.order.create({
      data: {
        merchantId,
        customerId: customer.id,
        orderNo,
        amount,
        status: 'DRAFT',
        note: memo || planId || 'App Subscription',
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    console.error('[POST /api/orders] 创建订单失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}

export const POST = withMetrics(__POST);
