// ============================================================
// Image generation worker (BullMQ)
// - Processes jobs from image-generation queue
// - Exponential backoff retry via queue config
// - Structured logging with traceId
// - Global exception handling with GenerationHistory status update
// ============================================================
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@/lib/prisma';
import { logger, getTraceId } from '@/lib/logger';
import type { ImageGenerationJobData, ImageGenerationJobResult } from '@/lib/queue/image.queue';

// Redis connection (reuse from queue)
const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

// Type alias for Prisma dynamic access
type AnyPrisma = typeof prisma & { generationHistory: { create: Function; update: Function } };

interface DallEResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

// Create worker instance
export const imageWorker = new Worker<ImageGenerationJobData, ImageGenerationJobResult>(
  'image-generation',
  async (job: Job<ImageGenerationJobData>): Promise<ImageGenerationJobResult> => {
    const {
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
    } = job.data;
    const startTime = Date.now();
    const db = prisma as AnyPrisma;

    // Force traceId for this worker execution
    const activeTraceId = traceId || getTraceId();
    let historyId: string | null = null;

    logger.info(
      { traceId: activeTraceId, jobId: job.id, attempt: job.attemptsMade + 1 },
      'Processing image generation'
    );

    // Create history record in pending state
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
    } catch (dbError) {
      logger.error(
        { traceId: activeTraceId, jobId: job.id, err: dbError },
        'Failed to create history record'
      );
      throw dbError; // Let BullMQ retry
    }

    try {
      logger.info(
        { traceId: activeTraceId, jobId: job.id, merchantId, model, size, quality },
        'Calling OpenAI image API'
      );

      const controller = new AbortController();
      const timeoutMs = parseInt(process.env.IMAGE_GENERATION_TIMEOUT_MS || '30000', 10);
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let openaiResponse: Response;
      try {
        openaiResponse = await fetch(`${openaiBaseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({ model, prompt, n, size, quality, response_format: 'url' }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const durationMs = Date.now() - startTime;

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        let errorMessage = `OpenAI API error: ${openaiResponse.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData?.error?.message || errorMessage;
        } catch {}

        logger.warn(
          {
            traceId: activeTraceId,
            jobId: job.id,
            httpStatus: openaiResponse.status,
            errorMessage,
          },
          'OpenAI API returned error'
        );

        if (historyId) {
          await db.generationHistory
            .update({
              where: { id: historyId },
              data: { status: 'failed', errorMessage, durationMs },
            })
            .catch(() => {});
        }

        // 429/功屋译发批次重复过期生成重复
        if (openaiResponse.status === 429 || openaiResponse.status >= 500) {
          throw new Error(errorMessage);
        }

        return { success: false, historyId: historyId ?? '', durationMs, errorMessage };
      }

      const data = (await openaiResponse.json()) as DallEResponse;
      const images = data.data || [];
      const primaryImageUrl = images[0]?.url || null;
      const revisedPrompt = images[0]?.revised_prompt;

      if (historyId) {
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
              allImages: images.map((img) => img.url).filter((u): u is string => u !== undefined),
            },
          },
        });
      }

      logger.info(
        { traceId: activeTraceId, jobId: job.id, durationMs, imageCount: images.length },
        'Image generation completed'
      );

      return {
        success: true,
        historyId: historyId ?? '',
        imageUrl: primaryImageUrl,
        images: images.map((img) => ({ url: img.url, revisedPrompt: img.revised_prompt })),
        durationMs,
      };
    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      const durationMs = Date.now() - startTime;
      const errorMessage = isAbort
        ? 'Image generation timed out'
        : error instanceof Error
          ? error.message
          : 'Image generation failed';

      logger.error(
        {
          traceId: activeTraceId,
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts?.attempts ?? 3,
          err: error,
          durationMs,
          isAbort,
        },
        'Image generation failed'
      );

      // Update GenerationHistory to FAILED
      if (historyId) {
        await db.generationHistory
          .update({
            where: { id: historyId },
            data: {
              status: 'failed',
              errorMessage,
              durationMs,
              metadata: {
                failedAt: new Date().toISOString(),
                attempt: job.attemptsMade + 1,
              },
            },
          })
          .catch(() => {});
      }

      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  }
);

// Event listeners
imageWorker.on(
  'completed',
  (job: Job<ImageGenerationJobData>, result: ImageGenerationJobResult) => {
    logger.info(
      {
        traceId: job.data.traceId,
        jobId: job.id,
        success: result.success,
        durationMs: result.durationMs,
      },
      'Job completed'
    );
  }
);

imageWorker.on('failed', (job: Job<ImageGenerationJobData> | undefined, error: Error) => {
  if (!job) return;
  logger.error(
    { traceId: job.data.traceId, jobId: job.id, attemptsMade: job.attemptsMade, err: error },
    'Job failed after all retries'
  );
});

imageWorker.on('error', (error: Error) => {
  logger.error({ err: error }, 'Worker error');
});

// ── Graceful shutdown handler ───────────────────────────
const SHUTDOWN_TIMEOUT_MS = 10_000; // 10s forced exit

async function shutdownGracefully(signal: string): Promise<void> {
  logger.info({ signal }, `Received ${signal}, closing worker...`);

  const forceExit = setTimeout(() => {
    logger.error({ signal }, 'Forced exit after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await imageWorker.close();
    logger.info({ signal }, 'Worker closed, quitting Redis...');
    await connection.quit();
    logger.info({ signal }, 'Redis connection closed, goodbye');
  } catch (err) {
    logger.error({ signal, err }, 'Error during graceful shutdown');
  } finally {
    clearTimeout(forceExit);
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
process.on('SIGINT', () => shutdownGracefully('SIGINT'));

// Prevent unhandled rejections from crashing the process silently
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection detected');
});
