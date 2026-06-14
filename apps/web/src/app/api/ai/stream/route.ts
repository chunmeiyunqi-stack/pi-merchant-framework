import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { streamMerchantAiResponse, logError } from '@pi-merchant/pi-sdk';
import { verifySessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Maximum duration for a single streaming AI response (60 seconds)
const STREAM_TIMEOUT_MS = 60_000;

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
  const provider = typeof body.provider === 'string' ? body.provider : undefined;

  if (!prompt) {
    return NextResponse.json({ success: false, error: 'Missing prompt' }, { status: 400 });
  }

  const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
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
            // Encode SSE data payload
            const data = JSON.stringify({ content: chunk.content });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          if (chunk.done) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            break;
          }
        }
      } catch (error) {
        logError('AI stream failed', error instanceof Error ? error : new Error(String(error)), {
          merchantId,
        });
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        // Send an error event instead of data
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`)
        );
      } finally {
        clearInterval(heartbeat);
        clearTimeout(timeoutId);
        try {
          controller.close();
        } catch {
          // ignore if already closed or errored
        }
      }
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
