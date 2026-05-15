import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateMerchantAiResponse, logEvent, logError } from '@pi-merchant/pi-sdk';
import { verifySessionToken } from '@/lib/session';

export async function POST(req: Request) {
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

  if (!prompt) {
    return NextResponse.json({ success: false, error: 'Missing prompt' }, { status: 400 });
  }

  const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001';
  const result = await generateMerchantAiResponse({ merchantId, prompt });

  if (!result.success) {
    logError('AI query failed', result.error, { merchantId, promptPreview: prompt.slice(0, 80) });
    return NextResponse.json(result, { status: 500 });
  }

  logEvent('AI query success', { merchantId, promptPreview: prompt.slice(0, 80) });
  return NextResponse.json(result);
}
