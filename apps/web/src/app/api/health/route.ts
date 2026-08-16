import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '2.1.0',
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
