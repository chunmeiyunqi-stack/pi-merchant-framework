import { NextResponse } from 'next/server';
import { piPlatformBase } from '@/lib/pi-platform';

export const dynamic = 'force-dynamic';

/**
 * 支付预检：探测 PI_API_KEY 是否被 Pi 平台认可（用假 paymentId 调 /approve）。
 * - not_set        → 未配置
 * - invalid        → 配置了但 Pi 平台拒绝（401 Invalid/missing API key）
 * - ok             → 有效（假 paymentId 返回 404 等其它状态）
 */
export async function GET() {
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, status: 'not_set' });
  }
  try {
    const piRes = await fetch(`${piPlatformBase()}/v2/payments/diag-probe/approve`, {
      method: 'POST',
      headers: { Authorization: `Key ${apiKey}` },
    });
    if (piRes.status === 401) {
      return NextResponse.json({ configured: true, status: 'invalid' });
    }
    return NextResponse.json({ configured: true, status: 'ok' });
  } catch {
    return NextResponse.json({ configured: true, status: 'check_failed' });
  }
}
