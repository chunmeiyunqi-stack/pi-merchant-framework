// ============================================================
// Image generation queue (BullMQ)
// - Exponential backoff retry for OpenAI throttling (429) / timeouts
// - Each job carries traceId for end-to-end tracing
// - 惰性初始化：避免在 Vercel 构建/导入阶段就连 Redis（否则会刷 ECONNREFUSED）
// ============================================================
import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

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

type ImageQueue = Queue<ImageGenerationJobData, ImageGenerationJobResult>;

// Redis 连接与队列实例均为惰性创建，首次调用 addImageGenerationJob 时才建立连接
let connection: IORedis | null = null;
let queue: ImageQueue | null = null;
let queueEvents: QueueEvents | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 3000);
        return delay;
      },
    });
    // 吞掉连接错误，避免无监听时触发 unhandledRejection（不可用时由上层 503 降级）
    connection.on('error', () => {});
  }
  return connection;
}

function getQueue(): ImageQueue {
  if (!queue) {
    queue = new Queue<ImageGenerationJobData, ImageGenerationJobResult>('image-generation', {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600 * 24, // keep completed jobs for 24h
          count: 100,
        },
        removeOnFail: {
          age: 3600 * 24 * 7, // keep failed jobs for 7 days
        },
      },
    });
  }
  return queue;
}

function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    queueEvents = new QueueEvents('image-generation', {
      connection: getConnection(),
    });
  }
  return queueEvents;
}

// Graceful shutdown（仅在实例已创建时关闭）
process.on('SIGTERM', async () => {
  if (queue) await queue.close().catch(() => {});
  if (queueEvents) await queueEvents.close().catch(() => {});
  if (connection) await connection.quit().catch(() => {});
});

// Type-safe wrapper for queue.add()（惰性创建队列，Redis 不可用时会抛错，由调用方 503 降级）
export async function addImageGenerationJob(
  name: string,
  data: ImageGenerationJobData
): Promise<import('bullmq').Job<ImageGenerationJobData, ImageGenerationJobResult, string>> {
  const q = getQueue();
  return (q as any).add(name, data) as Promise<
    import('bullmq').Job<ImageGenerationJobData, ImageGenerationJobResult, string>
  >;
}

// 保留一个惰性 getter 供未来内部使用（不触发连接）
export function getImageQueueEvents(): QueueEvents {
  return getQueueEvents();
}
