// ============================================================
// Pioneer AI Framework — POST /api/v1/images/generate
// Image generation API — enqueues async job via BullMQ
// Returns 202 Accepted with jobId immediately
// ============================================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logEvent, logError, runWithTenant, checkQuota, trackUsage } from '@pi-merchant/pi-sdk';
import { withMetrics } from '@/lib/metrics-middleware';
import { addImageGenerationJob } from '@/lib/queue/image.queue';
import { logger, getTraceId } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type AnyPrisma = typeof prisma & { generationHistory: any };

async function __POST(req: Request) {
  const startTime = Date.now();
  const traceId = getTraceId({ headers: { get: (name: string) => req.headers.get(name) } });

  // Verify authentication
  const token = cookies().get('pi_auth_token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const piUid = verifySessionToken(token);
  if (!piUid) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const size = (body.size as string) || '1024x1024';
  const quality = (body.quality as string) || 'standard';
  const model = (body.model as string) || 'dall-e-3';

  const isDallE3 = model === 'dall-e-3';
  const n = isDallE3 ? 1 : typeof body.n === 'number' ? Math.min(body.n, 4) : 1;

  if (!prompt) {
    return NextResponse.json({ success: false, error: 'Missing prompt' }, { status: 400 });
  }

  if (prompt.length > 4000) {
    return NextResponse.json(
      { success: false, error: 'Prompt too long (max 4000 characters)' },
      { status: 400 }
    );
  }

  const validModels = ['dall-e-2', 'dall-e-3'];
  if (!validModels.includes(model)) {
    return NextResponse.json(
      { success: false, error: `Invalid model. Must be one of: ${validModels.join(', ')}` },
      { status: 400 }
    );
  }

  const dallE3Sizes = ['1024x1024', '1792x1024', '1024x1792'];
  const dallE2Sizes = ['256x256', '512x512', '1024x1024'];
  const validSizes = isDallE3 ? dallE3Sizes : dallE2Sizes;
  if (!validSizes.includes(size)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid size for ${model}. Must be one of: ${validSizes.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return NextResponse.json(
      { success: false, error: 'Image generation service not configured' },
      { status: 503 }
    );
  }

  const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID ?? 'merchant-demo-001';

  const maxRequestsPerMonth = parseInt(process.env.AI_MAX_REQUETS_PER_MONTH || '1000', 10);
  const quota = checkQuota(merchantId, merchantId, maxRequestsPerMonth);
  if (quota.isExceeded) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Monthly AI request quota exceeded. Please upgrade your plan or wait for the next billing cycle.',
        quota: {
          used: quota.usedRequestsThisMonth,
          limit: quota.maxRequestsPerMonth,
          resetAt: quota.resetAt,
        },
      },
      { status: 429 }
    );
  }

  const openaiBaseUrl = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const db = prisma as AnyPrisma;

  // Create pending history record synchronously (fast path, no queue wait)
  let historyId: string | null = null;
  try {
    const record = await db.generationHistory.create({
      data: {
        merchantId,
        piUid,
        type: 'IMAGE',
        provider: 'openai',
        model,
        prompt,
        status: 'pending',
      },
    });
    historyId = record.id as string;
  } catch (dbError: any) {
    logger.error({ traceId, err: dbError }, 'Failed to create image generation history');
    return NextResponse.json(
      { success: false, error: 'Failed to initialize generation' },
      { status: 500 }
    );
  }

  // Enqueue async job with exponential backoff retry
  try {
    const job = await addImageGenerationJob('generate-image', {
      traceId,
      piUid,
      merchantId,
      prompt,
      size,
      quality,
      model,
      n,
      openaiApiKey,
      openaiBaseUrl,
    });

    logger.info({ traceId, jobId: job.id, historyId }, 'Image generation job enqueued');

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: job.id,
          historyId,
          status: 'pending',
          estimatedWaitMs: 5000,
        },
      },
      { status: 202 }
    );
  } catch (queueError: any) {
    logger.error({ traceId, err: queueError, historyId }, 'Failed to enqueue image generation job');

    await db.generationHistory
      .update({
        where: { id: historyId },
        data: {
          status: 'failed',
          errorMessage: 'Queue unavailable',
          durationMs: Date.now() - startTime,
        },
      })
      .catch(() => {});

    return NextResponse.json(
      { success: false, error: 'Generation service temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}

export const POST = withMetrics(__POST);
