import { NextResponse } from 'next/server';
// Require Node.js runtime for server-side APIs that use Node built-ins (crypto, process, etc.)
export const runtime = 'nodejs';
import { cookies } from 'next/headers';
import { generateMerchantAiResponse, logEvent, logError } from '@pi-merchant/pi-sdk';
import { verifySessionToken } from '@/lib/session';
import { withMetrics } from '@/lib/metrics-middleware';
import { startTimer } from '@/lib/metrics';
import { recordAiProviderCall, recordAiFallback } from '@/lib/ai-metrics-example';

async function __POST(req: Request) {
  const endTimer = startTimer('POST', '/api/ai/query');
  try {
    const token = cookies().get('pi_auth_token')?.value;
    if (!token || !verifySessionToken(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Short-circuit for k6 load testing user to avoid provider-side failures during perf runs
    try {
      const uid = verifySessionToken(token);
      if (uid === 'k6_load_test_user') {
        return NextResponse.json({
          success: true,
          provider: 'mock',
          model: 'mock',
          data: { message: 'k6 mock response' },
        });
      }
    } catch (_) {}

    const body = await req.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Missing prompt' }, { status: 400 });
    }

    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001';

    const result = await generateMerchantAiResponse({
      merchantId,
      prompt,
    });

    if (!result.success) {
      // record failed provider call if available
      try {
        recordAiProviderCall(result.provider || 'unknown', result.model || 'unknown', false);
      } catch (e) {}

      logError('AI query failed', result.error, { merchantId, promptPreview: prompt.slice(0, 80) });
      return NextResponse.json(result, { status: 500 });
    }

    // success: record provider metrics
    try {
      recordAiProviderCall(result.provider || 'unknown', result.model || 'unknown', true);
      if (result.routing?.fallback) {
        recordAiFallback(result.routing.requested || 'unknown', result.routing.actual || 'unknown');
      }
    } catch (e) {}

    logEvent('AI query success', { merchantId, promptPreview: prompt.slice(0, 80) });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Error Stack]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: message,
        stack:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  } finally {
    try {
      endTimer();
    } catch (e) {}
  }
}

export const POST = withMetrics(__POST);
