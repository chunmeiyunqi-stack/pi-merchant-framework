// ============================================================
// Image generation queue (BullMQ)
// - Exponential backoff retry for OpenAI throttling (429) / timeouts
// - Each job carries traceId for end-to-end tracing
// ============================================================
import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '@/lib/logger';

// Redis connection (reuse singleton)
let connection: IORedis | null = null;
function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 3000);
        return delay;
      },
    });
  }
  return connection;
}

// Job data type
export interface ImageGenerationJobData {
  traceId: string;
  piUid: string;
  merchantId: string;
  prompt: string;
  size: string;
  quality: string;
  model: string;
  n: number;
  openaiApiKey: string;
  openaiBaseUrl: string;
}

// Job result type
export interface ImageGenerationJobResult {
  success: boolean;
  historyId: string;
  imageUrl?: string | null;
  images?: Array<{ url?: string; revisedPrompt?: string }>;
  durationMs: number;
  errorMessage?: string;
}

// Queue instance
export const imageQueue = new Queue<ImageGenerationJobData, ImageGenerationJobResult>('image-generation', {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600 * 24,      // keep completed jobs for 24h
      count: 100,
    },
    removeOnFail: {
      age: 3600 * 24 * 7,  // keep failed jobs for 7 days
    },
  },
});

// Queue events for monitoring
export const imageQueueEvents = new QueueEvents('image-generation', {
  connection: getConnection(),
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await imageQueue.close();
  await imageQueueEvents.close();
  if (connection) await connection.quit();
});

logger.info({
  redisUrl: (process.env.REDIS_URL ?? 'redis://localhost:6379').replace(/\/\/.*@/, '//***@'),
}, 'Image generation queue initialized');
// Type-safe wrapper for queue.add() to work around BullMQ strict generics
export async function addImageGenerationJob(
  name: string,
  data: ImageGenerationJobData,
): Promise<import('bullmq').Job<ImageGenerationJobData, ImageGenerationJobResult, string>> {
  return (imageQueue as any).add(name, data) as Promise<import('bullmq').Job<ImageGenerationJobData, ImageGenerationJobResult, string>>;
}