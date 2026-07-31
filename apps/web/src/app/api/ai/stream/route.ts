import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  streamMerchantAiResponse,
  logError,
  runWithTenant,
  trackUsage,
  checkQuota,
} from '@pi-merchant/pi-sdk';
import { verifySessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Maximum duration for a single streaming AI response (120 seconds)
const STREAM_TIMEOUT_MS = 120_000;

export async function POST(req: Request) {
  const token = cookies().get('pi_auth_token')?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const provider = (typeof body.provider === 'string' ? body.provider : undefined) as
    'openai' | 'anthropic' | 'ollama' | undefined;

  if (!prompt) {
    return NextResponse.json({ success: false, error: 'Missing prompt' }, { status: 400 });
  }

  const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001';

  // ── 多租户配额检查 ──
  const maxRequestsPerMonth = parseInt(process.env.AI_MAX_REQUESTS_PER_MONTH || '1000', 10);
  const quota = checkQuota(merchantId, merchantId, maxRequestsPerMonth);
  if (quota.isExceeded) {
    return NextResponse.json(
      { success: false, error: 'Monthly AI request quota exceeded.' },
      { status: 429 }
    );
  }

  const startTime = Date.now();
  const encoder = new TextEncoder();

  // ReadableStream 不可以被 runWithTenant 直接包裹（它是同步构建的），
  // 改为在流内部的 start() 回调中调用 runWithTenant，确保 AsyncLocalStorage 上下文传播。
  const stream = new ReadableStream({
    async start(controller) {
      await runWithTenant(merchantId, async () => {
        // 15s heartbeat to prevent Vercel/Nginx from closing idle connection
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': ping\n\n'));
          } catch {
            clearInterval(heartbeat);
          }
        }, 15000);

        // Overall 60s timeout — abort the stream if it takes too long
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => {
          timeoutController.abort();
        }, STREAM_TIMEOUT_MS);

        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          clearTimeout(timeoutId);
          timeoutController.abort();
        });

        try {
          const streamIterable = streamMerchantAiResponse({ merchantId, prompt, provider });

          for await (const chunk of streamIterable) {
            // Check for client disconnect OR timeout
            if (req.signal.aborted || timeoutController.signal.aborted) {
              if (timeoutController.signal.aborted) {
                controller.enqueue(
                  encoder.encode(
                    `event: error\ndata: ${JSON.stringify({ message: 'Stream timed out after 60 seconds' })}\n\n`
                  )
                );
              }
              break;
            }

            if (chunk.content) {
              const data = JSON.stringify({ content: chunk.content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            if (chunk.done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              trackUsage({
                tenantId: merchantId,
                merchantId,
                type: 'stream_request',
                latencyMs: Date.now() - startTime,
                success: true,
              });
              break;
            }
          }
        } catch (error) {
          logError('AI stream failed', error instanceof Error ? error : new Error(String(error)), {
            merchantId,
          });
          const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`)
          );
          trackUsage({
            tenantId: merchantId,
            merchantId,
            type: 'stream_request',
            latencyMs: Date.now() - startTime,
            success: false,
            error: errorMessage,
          });
        } finally {
          clearInterval(heartbeat);
          clearTimeout(timeoutId);
          try {
            controller.close();
          } catch {
            // ignore if already closed or errored
          }
        }
      }); // end runWithTenant
    },
    cancel() {
      // Stream cancelled by consumer
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
