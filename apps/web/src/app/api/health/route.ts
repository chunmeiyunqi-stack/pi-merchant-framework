import { NextResponse } from 'next/server';
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
