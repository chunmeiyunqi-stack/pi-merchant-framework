// ============================================================
// Structured logger (Pino) — 统一日志输出，支持 traceId 追踪
// ============================================================
import pino from 'pino';
import { randomUUID } from 'crypto';

// 运行时配置
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug');

// 单例 Transport
const transport = isProduction
  ? undefined // 生产环境输出 JSON 行，由容器运行时（Docker/Paas）收集
  : pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });

// 创建全局 logger 实例
export const logger = pino(
  {
    level: logLevel,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'body.apiKey', 'body.secret'],
      censor: '[REDACTED]',
    },
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
    mixin() {
      return {};
    },
  },
  transport
);

/**
 * 获取当前请求的 traceId（从 AsyncLocalStorage 或 headers）
 * 若不存在则生成新的 UUID 兜底
 */
export function getTraceId(request?: {
  headers?: { get?: (name: string) => string | null };
}): string {
  if (request?.headers?.get) {
    const fromHeader = request.headers.get('x-trace-id');
    if (fromHeader) return fromHeader;
  }
  // 兜底：运行时生成（worker 场景等无 HTTP 上下文时使用）
  return randomUUID();
}

/**
 * 带 traceId 的日志快捷函数
 */
export function logWithTrace(
  traceId: string,
  level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace',
  message: string,
  context?: Record<string, unknown>
): void {
  logger[level]({ traceId, ...context }, message);
}
