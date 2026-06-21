// ============================================================
// Pioneer AI Framework — POST /api/v1/videos/generate
// 视频生成 API — 预留接口（框架级别实现）
//
// 当前实现：
//   - 接口结构完整，可接收请求并记录到 GenerationHistory
//   - 实际生成逻辑预留：可对接 Runway ML、Pika Labs、Kling AI 等
//   - 通过 VIDEO_PROVIDER 环境变量切换提供商
// ============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logEvent, logError, runWithTenant, checkQuota, trackUsage } from '@pi-merchant/pi-sdk';
import { withMetrics } from '@/lib/metrics-middleware';

export const dynamic = 'force-dynamic';

// 120 second timeout for video generation (video takes longer)
const VIDEO_GENERATION_TIMEOUT_MS = 120_000;

// Type alias for the GenerationHistory model - Prisma Client may not have generated yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = typeof prisma & { generationHistory: any };

async function __POST(req: Request) {
  const startTime = Date.now();

  // Verify authentication - verifySessionToken returns the piUid string or null
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
  const duration = typeof body.duration === 'number' ? Math.min(body.duration, 30) : 5;
  const resolution = (body.resolution as string) || '1280x720';
  const provider = (body.provider as string) || process.env.VIDEO_PROVIDER || 'placeholder';

  if (!prompt) {
    return NextResponse.json({ success: false, error: 'Missing prompt' }, { status: 400 });
  }

  if (prompt.length > 2000) {
    return NextResponse.json(
      { success: false, error: 'Prompt too long (max 2000 characters)' },
      { status: 400 }
    );
  }

  const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID ?? 'merchant-demo-001';

  // ── 多租户配额检查 ──
  const maxRequestsPerMonth = parseInt(process.env.AI_MAX_REQUESTS_PER_MONTH || '1000', 10);
  const quota = checkQuota(merchantId, merchantId, maxRequestsPerMonth);
  if (quota.isExceeded) {
    return NextResponse.json(
      {
        success: false,
        error: 'Monthly AI request quota exceeded.',
        quota: { used: quota.usedRequestsThisMonth, limit: quota.maxRequestsPerMonth, resetAt: quota.resetAt },
      },
      { status: 429 }
    );
  }

  const db = prisma as AnyPrisma;
  let historyId: string | null = null;

  return runWithTenant(merchantId, async () => {
  try {
    // Pre-create a 'pending' history record
    const historyRecord = await db.generationHistory.create({
      data: {
        merchantId,
        piUid,
        type: 'VIDEO',
        provider,
        model: provider === 'runway' ? 'gen-3-alpha' : 'placeholder',
        prompt,
        status: 'pending',
        metadata: { duration, resolution },
      },
    });
    historyId = historyRecord.id as string;

    logEvent('Video generation started', {
      merchantId,
      piUid,
      provider,
      duration,
      resolution,
      promptPreview: prompt.slice(0, 100),
    });

    // ──────────────────────────────────────────────────────
    // Provider routing — extend this switch to add new providers
    // ──────────────────────────────────────────────────────
    if (provider === 'runway' && process.env.RUNWAY_API_KEY) {
      return await handleRunwayGeneration({
        prompt,
        duration,
        resolution,
        merchantId,
        piUid,
        historyId,
        startTime,
        db,
      });
    }

    // Default: Placeholder response (service coming soon)
    const durationMs = Date.now() - startTime;

    await db.generationHistory.update({
      where: { id: historyId },
      data: {
        status: 'pending',
        metadata: {
          duration,
          resolution,
          provider,
          note: 'Video generation provider not yet configured. Request queued.',
        },
        durationMs,
      },
    });

    logEvent('Video generation queued (no provider)', { merchantId, provider });

    trackUsage({ tenantId: merchantId, merchantId, type: 'ai_request', provider, model: 'placeholder', latencyMs: durationMs, success: true });

    return NextResponse.json({
      success: true,
      data: {
        status: 'queued',
        message:
          'Video generation has been queued. This feature requires a video generation provider to be configured. ' +
          'Supported providers: Runway ML (set RUNWAY_API_KEY), Pika Labs, Kling AI. ' +
          'Contact support to enable video generation for your account.',
        historyId,
        provider,
        prompt,
        estimatedDurationSeconds: duration,
        resolution,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Video generation failed';

    if (historyId) {
      await db.generationHistory
        .update({
          where: { id: historyId },
          data: {
            status: 'failed',
            errorMessage,
            durationMs: Date.now() - startTime,
          },
        })
        .catch(() => {
          /* ignore */
        });
    }

    trackUsage({ tenantId: merchantId, merchantId, type: 'ai_request', provider, latencyMs: Date.now() - startTime, success: false, error: errorMessage });

    logError('Video generation failed', error, {
      merchantId,
      provider,
      promptPreview: prompt.slice(0, 100),
    });

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
  }); // end runWithTenant
}

export const POST = withMetrics(__POST);

// ──────────────────────────────────────────────────────────────
// Runway ML provider handler (stub — to be completed when API key is available)
// ──────────────────────────────────────────────────────────────
async function handleRunwayGeneration(params: {
  prompt: string;
  duration: number;
  resolution: string;
  merchantId: string;
  piUid: string;
  historyId: string;
  startTime: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}): Promise<NextResponse> {
  const { prompt, duration, resolution, merchantId, historyId, startTime, db } = params;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VIDEO_GENERATION_TIMEOUT_MS);

  try {
    // Runway ML API call skeleton — replace with actual endpoint when API is confirmed
    const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        promptText: prompt,
        duration,
        ratio: resolution === '1280x720' ? '1280:720' : '720:1280',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = (await response.json()) as { id?: string; error?: string };
    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(data.error || `Runway API error: ${response.status}`);
    }

    await db.generationHistory.update({
      where: { id: historyId },
      data: {
        status: 'processing',
        metadata: { taskId: data.id, duration, resolution },
        durationMs,
      },
    });

    logEvent('Runway video generation submitted', { merchantId, taskId: data.id });

    return NextResponse.json({
      success: true,
      data: {
        status: 'processing',
        taskId: data.id,
        historyId,
        message: 'Video generation submitted. Use the task ID to poll for completion.',
        estimatedCompletionSeconds: duration * 10,
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const errorMessage = isTimeout
      ? 'Video generation timed out'
      : error instanceof Error
        ? error.message
        : 'Runway API call failed';

    await db.generationHistory
      .update({
        where: { id: historyId },
        data: {
          status: 'failed',
          errorMessage,
          durationMs: Date.now() - startTime,
        },
      })
      .catch(() => {
        /* ignore */
      });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
