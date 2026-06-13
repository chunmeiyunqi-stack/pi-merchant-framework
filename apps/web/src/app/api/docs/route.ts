import { NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';

export async function GET() {
  try {
    const spec = getApiDocs();
    return NextResponse.json(spec);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to build OpenAPI spec' }, { status: 500 });
  }
}
