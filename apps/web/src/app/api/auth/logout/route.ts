import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withMetrics } from '@/lib/metrics-middleware';

async function __POST() {
  cookies().delete('pi_auth_token');
  return NextResponse.json({ success: true });
}

export const POST = withMetrics(__POST);
