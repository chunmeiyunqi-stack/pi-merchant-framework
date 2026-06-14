import { NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';
import { withMetrics } from '@/lib/metrics-middleware';

async function __GET() {
  try {
    const spec = getApiDocs();
    return NextResponse.json(spec);
  } catch (_e) {
    return NextResponse.json({ error: 'Failed to build OpenAPI spec' }, { status: 500 });
  }
}

export const GET = withMetrics(__GET);
