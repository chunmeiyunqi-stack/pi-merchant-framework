import { randomUUID } from 'crypto';

interface LockResult {
  acquired: boolean;
  lockValue?: string;
  errorReason?: string;
  isProdMissingRedis?: boolean;
}

const memoryLockMap = new Map<string, { value: string; expiresAt: number }>();

export async function acquireLock(key: string, ttlSeconds = 30): Promise<LockResult> {
  const redisUrl = process.env.REDIS_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  const lockValue = randomUUID();

  if (!redisUrl && isProduction) {
    console.error(
      `[DISTRIBUTED LOCK] [CRITICAL] REDIS_URL is missing in production environment for key: ${key}. Rejecting payment request.`
    );
    return {
      acquired: false,
      isProdMissingRedis: true,
      errorReason:
        'Payment processing unavailable due to missing distributed lock configuration (REDIS_URL required in production)',
    };
  }

  if (redisUrl) {
    try {
      const Redis = require('ioredis');
      const client = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
      const result = await client.set(key, lockValue, 'NX', 'EX', ttlSeconds);
      await client.quit();

      if (result === 'OK') {
        return { acquired: true, lockValue };
      }
      return { acquired: false, errorReason: 'Lock already held by another process' };
    } catch (err: any) {
      console.error('[DISTRIBUTED LOCK] Redis error during acquireLock:', err?.message || err);
      if (isProduction) {
        return {
          acquired: false,
          errorReason: `Redis lock acquisition error: ${err?.message || 'Connection failed'}`,
        };
      }
    }
  }

  const now = Date.now();
  const existing = memoryLockMap.get(key);

  if (existing && existing.expiresAt > now) {
    return { acquired: false, errorReason: 'Memory lock held by concurrent request' };
  }

  memoryLockMap.set(key, {
    value: lockValue,
    expiresAt: now + ttlSeconds * 1000,
  });

  return { acquired: true, lockValue };
}

export async function releaseLock(key: string, lockValue: string): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const Redis = require('ioredis');
      const client = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await client.eval(script, 1, key, lockValue);
      await client.quit();
      return true;
    } catch (_err) {
      // Ignore release errors
    }
  }

  const existing = memoryLockMap.get(key);
  if (existing && existing.value === lockValue) {
    memoryLockMap.delete(key);
    return true;
  }
  return false;
}
