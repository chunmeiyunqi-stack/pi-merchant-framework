// ================================================================
// PiMerchantFramework — Shared API Types
// packages/pi-sdk/src/types/api.ts
// ================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Per-request configuration */
export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  /** Timeout in ms. Default: 30_000 */
  timeout?: number;
  /** Max retries on 5xx / network error. Default: 3 */
  retries?: number;
  /** Base delay (ms) for exponential backoff. Default: 500 */
  retryDelay?: number;
  /** External cancellation signal */
  signal?: AbortSignal;
  /**
   * Deduplication key.
   * A new request with the same key aborts the previous in-flight one.
   * Use for: search-as-you-type, tab switches, re-submits, etc.
   */
  requestKey?: string;
}

/** Normalised successful response */
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

/** Quota details attached to 429 ApiError */
export interface QuotaInfo {
  type: 'rate_limit' | 'monthly_quota';
  resetAt?: string; // ISO-8601 for monthly quota reset
  retryAfter?: number; // seconds until safe to retry (rate limit)
}

/** Structured error for every non-2xx response */
export class ApiError extends Error {
  public readonly status: number;
  public readonly quota?: QuotaInfo;
  public readonly details?: unknown;
  public readonly code: string;
  public readonly retryable: boolean;

  constructor(message: string, status: number, quota?: QuotaInfo, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.quota = quota;
    this.details = details;

    // Derive standard error fields
    this.code = ApiError.deriveErrorCode(status, details);
    this.retryable = ApiError.deriveRetryable(status);
  }

  private static deriveErrorCode(status: number, details: unknown): string {
    if (details && typeof details === 'object') {
      const detailObj = details as Record<string, unknown>;
      if (typeof detailObj.code === 'string') return detailObj.code;
      if (detailObj.error && typeof detailObj.error === 'object') {
        const errObj = detailObj.error as Record<string, unknown>;
        if (typeof errObj.code === 'string') return errObj.code;
      }
    }
    switch (status) {
      case 0:
        return 'NETWORK_ERROR';
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 429:
        return 'RATE_LIMIT';
      default:
        return status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR';
    }
  }

  private static deriveRetryable(status: number): boolean {
    return status >= 500 || status === 429 || status === 0;
  }

  isRateLimit(): boolean {
    return this.status === 429;
  }
  isUnauthorized(): boolean {
    return this.status === 401;
  }
  isForbidden(): boolean {
    return this.status === 403;
  }
  isNotFound(): boolean {
    return this.status === 404;
  }
  isServerError(): boolean {
    return this.status >= 500;
  }
  isNetworkError(): boolean {
    return this.status === 0;
  }
}

// ─── Interceptor Types ────────────────────────────────────────────────────────

/** Mutate / enrich outgoing config */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

/** Inspect / transform successful response */
export type ResponseInterceptor<T = unknown> = (
  response: ApiResponse<T>
) => ApiResponse<T> | Promise<ApiResponse<T>>;

/**
 * Handle ApiError. Must either:
 * - `throw error` / modified error → propagate
 * - `return error`                 → pass to next error interceptor
 */
export type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError> | never;

export interface InterceptorChain {
  request: RequestInterceptor[];
  response: ResponseInterceptor[];
  error: ErrorInterceptor[];
}
