import type { LogLevel } from './types';

const SERVICE_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || process.env.APP_NAME || 'pi-merchant-framework';

function createPayload(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  return {
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    level,
    message,
    metadata: metadata ? metadata : undefined,
  } as const;
}

function safeStringify(obj: unknown): string {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    return value;
  });
}

export function log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  const payload = createPayload(level, message, metadata);
  let formatted = '';
  try {
    formatted = safeStringify(payload);
  } catch (_e) {
    formatted = JSON.stringify({ error: 'stringify_failed' });
  }

  switch (level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
    default:
      console.info(formatted);
  }

  const webhookUrl = process.env.MONITORING_WEBHOOK_URL;
  if (webhookUrl) {
    void fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: formatted,
    }).catch((error) => {
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          service: SERVICE_NAME,
          level: 'warn',
          message: 'Monitoring webhook failed',
          metadata: { error: String(error), webhook: webhookUrl },
        })
      );
    });
  }
}

export function logEvent(message: string, metadata?: Record<string, unknown>) {
  log('info', message, metadata);
}

export function logDebug(message: string, metadata?: Record<string, unknown>) {
  log('debug', message, metadata);
}

export function logWarn(message: string, metadata?: Record<string, unknown>) {
  log('warn', message, metadata);
}

export function logError(message: string, error?: unknown, metadata?: Record<string, unknown>) {
  const errorDetails =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { error: String(error) };
  log('error', message, { ...metadata, ...errorDetails });
}

export async function trackMetric(name: string, value: number, tags?: Record<string, string>) {
  const metadata = { name, value, tags };
  log('info', 'metric.recorded', metadata);
}
