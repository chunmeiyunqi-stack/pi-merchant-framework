// ================================================================
// PiMerchantFramework — Rate Limit / Quota Error Interceptor
// packages/pi-sdk/src/interceptors/rateLimit.ts
// ================================================================

import type { ErrorInterceptor, QuotaInfo } from '../types/api';
import { ApiError } from '../types/api';

export interface RateLimitCallbacks {
  /** Called when per-minute / per-hour rate limit is hit */
  onRateLimit?: (retryAfter: number) => void;
  /** Called when monthly billing quota is exhausted */
  onQuotaExhausted?: (resetAt?: string) => void;
  /** Called for any 429 (fires after the specific callback above) */
  on429?: (info: QuotaInfo) => void;
}

/**
 * Processes 429 ApiErrors and dispatches the appropriate UI callbacks.
 * Always re-throws so the caller can decide whether to surface or swallow.
 *
 * Usage:
 * ```ts
 * client.addErrorInterceptor(
 *   createRateLimitInterceptor({
 *     onRateLimit: (s) => toast.warning(`Throttled – retry in ${s}s`),
 *     onQuotaExhausted: (date) => toast.error(`Quota exhausted until ${date}`),
 *   })
 * );
 * ```
 */
export function createRateLimitInterceptor(
  callbacks: RateLimitCallbacks = {},
): ErrorInterceptor {
  return (error: ApiError): never => {
    if (error.isRateLimit() && error.quota) {
      const info = error.quota;

      if (info.type === 'monthly_quota') {
        callbacks.onQuotaExhausted?.(info.resetAt);
      } else {
        callbacks.onRateLimit?.(info.retryAfter ?? 60);
      }

      callbacks.on429?.(info);
    }

    throw error; // always propagate — never swallow silently
  };
}

/**
 * Automatic retry interceptor for rate-limited requests.
 * Waits `retryAfter` seconds, then retries once transparently.
 * Only use when you have a lightweight endpoint (not image gen).
 */
export function createAutoRetryInterceptor(
  maxWaitSeconds = 10,
): ErrorInterceptor {
  return async (error: ApiError): Promise<never> => {
    if (
      error.isRateLimit() &&
      error.quota?.type === 'rate_limit' &&
      (error.quota.retryAfter ?? Infinity) <= maxWaitSeconds
    ) {
      const waitMs = (error.quota.retryAfter ?? 5) * 1_000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      // The retry itself needs to bubble back to the caller via re-throw
      // so the client loop can handle it; here we just delay then re-throw
    }
    throw error;
  };
}
