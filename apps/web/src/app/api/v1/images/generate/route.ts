// ============================================================
// Pioneer AI Framework — POST /api/v1/images/generate
// 图片生成 API — 调用 OpenAI DALL-E 3 生成图片
// 生成结果写入 GenerationHistory 表
// ============================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logEvent, logError, runWithTenant, checkQuota, trackUsage } from '@pi-merchant/pi-sdk';
import { withMetrics } from '@/lib/metrics-middleware';

export const dynamic = 'force-dynamic';

// 30 second timeout for image generation
const IMAGE_GENERATION_TIMEOUT_MS = 30_000;

// Type alias for the GenerationHistory model - Prisma Client may not have generated yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrisma = typeof prisma & { generationHistory: any };

interface DallEResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

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
  const size = (body.size as string) || '1024x1024';
  const quality = (body.quality as string) || 'standard';
  const model = (body.model as string) || 'dall-e-3';

  // DALL-E 3 only supports n=1; DALL-E 2 supports up to 10 (cap at 4 for cost control)
  const isDallE3 = model === 'dall-e-3';
  const n = isDallE3 ? 1 : (typeof body.n === 'number' ? Math.min(body.n, 4) : 1);

  if (!prompt) {
    return NextResponse.json({ success: false, error: 'Missing prompt' }, { status: 400 });
  }

  if (prompt.length > 4000) {
    return NextResponse.json(
      { success: false, error: 'Prompt too long (max 4000 characters)' },
      { status: 400 }
    );
  }

  // Validate model
  const validModels = ['dall-e-2', 'dall-e-3'];
  if (!validModels.includes(model)) {
    return NextResponse.json(
      { success: false, error: `Invalid model. Must be one of: ${validModels.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate size per model:
  // - DALL-E 3: 1024x1024, 1792x1024, 1024x1792
  // - DALL-E 2: 256x256, 512x512, 1024x1024
  const dallE3Sizes = ['1024x1024', '1792x1024', '1024x1792'];
  const dallE2Sizes = ['256x256', '512x512', '1024x1024'];
  const validSizes = isDallE3 ? dallE3Sizes : dallE2Sizes;
  if (!validSizes.includes(size)) {
    return NextResponse.json(
      { success: false, error: `Invalid size for ${model}. Must be one of: ${validSizes.join(', ')}` },
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

  // merchantId 只从服务端配置读取，不接受任何客户端传入的 tenant 声明，
  // 防止通过 x-tenant-id 头部或 merchant_id Cookie 进行跨租户数据越权访问（IDOR）。
  const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID ?? 'merchant-demo-001';

  // ── 多租户配额检查：在消耗任何 AI 资源之前强制执行 ──
  const maxRequestsPerMonth = parseInt(process.env.AI_MAX_REQUESTS_PER_MONTH || '1000', 10);
  const quota = checkQuota(merchantId, merchantId, maxRequestsPerMonth);
  if (quota.isExceeded) {
    return NextResponse.json(
      {
        success: false,
        error: 'Monthly AI request quota exceeded. Please upgrade your plan or wait for the next billing cycle.',
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

  // AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_GENERATION_TIMEOUT_MS);

  let historyId: string | null = null;

  // ── 所有 DB / AI 操作在租户上下文中执行，Prisma 中间件自动注入 merchantId 过滤 ──
  return runWithTenant(merchantId, async () => {
    try {
      // Pre-create a 'pending' history record
      const historyRecord = await db.generationHistory.create({
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
      historyId = historyRecord.id as string;

      logEvent('Image generation started', {
        merchantId,
        piUid,
        model,
        size,
        quality,
        promptPreview: prompt.slice(0, 100),
      });

      // Call OpenAI Images API
      const openaiResponse = await fetch(`${openaiBaseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          n,
          size,
          quality,
          response_format: 'url',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        let errorMessage = `OpenAI API error: ${openaiResponse.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData?.error?.message || errorMessage;
        } catch {
          // Use default error message
        }

        await db.generationHistory.update({
          where: { id: historyId },
          data: {
            status: 'failed',
            errorMessage,
            durationMs: Date.now() - startTime,
          },
        });

        trackUsage({ tenantId: merchantId, merchantId, type: 'ai_request', provider: 'openai', model, latencyMs: Date.now() - startTime, success: false, error: errorMessage });

        logError('Image generation API error', new Error(errorMessage), {
          merchantId,
          httpStatus: openaiResponse.status,
        });

        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: openaiResponse.status >= 500 ? 502 : 400 }
        );
      }

      const data = (await openaiResponse.json()) as DallEResponse;
      const images = data.data || [];
      const primaryImageUrl = images[0]?.url || null;
      const revisedPrompt = images[0]?.revised_prompt;
      const durationMs = Date.now() - startTime;

      // Update history record as completed
      await db.generationHistory.update({
        where: { id: historyId },
        data: {
          imageUrl: primaryImageUrl,
          status: 'completed',
          durationMs,
          metadata: {
            size,
            quality,
            n,
            revisedPrompt: revisedPrompt || prompt,
            allImages: images.map((img) => img.url).filter(Boolean),
          },
        },
      });

      trackUsage({ tenantId: merchantId, merchantId, type: 'ai_request', provider: 'openai', model, latencyMs: durationMs, success: true });

      logEvent('Image generation completed', {
        merchantId,
        piUid,
        model,
        durationMs,
        imageCount: images.length,
      });

      return NextResponse.json({
        success: true,
        data: {
          images: images.map((img) => ({
            url: img.url,
            revisedPrompt: img.revised_prompt || prompt,
          })),
          model,
          provider: 'openai',
          prompt,
          durationMs,
          historyId,
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const errorMessage = isTimeout
        ? 'Image generation timed out (30s limit)'
        : error instanceof Error
          ? error.message
          : 'Image generation failed';

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
          .catch(() => { /* ignore DB update error */ });
      }

      trackUsage({ tenantId: merchantId, merchantId, type: 'ai_request', provider: 'openai', model, latencyMs: Date.now() - startTime, success: false, error: errorMessage });

      logError('Image generation failed', error, {
        merchantId,
        isTimeout,
        promptPreview: prompt.slice(0, 100),
      });

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: isTimeout ? 504 : 500 }
      );
    }
  });
}

export const POST = withMetrics(__POST);
