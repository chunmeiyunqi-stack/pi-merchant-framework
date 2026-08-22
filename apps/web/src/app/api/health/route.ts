import { NextResponse } from 'next/server';
import { piPlatformBase } from '@/lib/pi-platform';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '2.1.0',
  };

  // 环境变量就绪状态（只报 set/not set，不泄露实际值）
  checks.env = {
    PI_API_KEY: process.env.PI_API_KEY ? 'set' : 'MISSING',
    PI_SESSION_SECRET: process.env.PI_SESSION_SECRET ? 'set' : 'MISSING',
    PI_PLATFORM_API_BASE: process.env.PI_PLATFORM_API_BASE || '(default)',
    NEXT_PUBLIC_PI_SANDBOX: process.env.NEXT_PUBLIC_PI_SANDBOX || '(unset→prod=mainnet)',
  };

  // 探测 PI_API_KEY 是否被 Pi 平台认可：用假 paymentId 调 /approve
  //   - 401 "Invalid/missing API key" → key 无效/被撤销
  //   - 404/其它 → key 有效（只是假 paymentId 不存在）
  if (process.env.PI_API_KEY) {
    try {
      const piRes = await fetch(`${piPlatformBase()}/v2/payments/diag-probe/approve`, {
        method: 'POST',
        headers: { Authorization: `Key ${process.env.PI_API_KEY}` },
      });
      const body = (await piRes.text()).slice(0, 80);
      checks.piApiKeyProbe =
        piRes.status === 401 ? `INVALID (401 ${body})` : `ok (${piRes.status} ${body})`;
    } catch (e) {
      checks.piApiKeyProbe = 'check_failed: ' + (e instanceof Error ? e.message : String(e));
    }
  } else {
    checks.piApiKeyProbe = 'not_set';
  }

  let dbOk = false;
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
  }

  checks.database = dbOk ? 'connected' : 'unavailable';

  const healthy = !process.env.DATABASE_URL || dbOk;
  return NextResponse.json(checks, { status: healthy ? 200 : 503 });
}
