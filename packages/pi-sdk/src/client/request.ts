// ================================================================
// PiMerchantFramework — Core Request Client
// packages/pi-sdk/src/client/request.ts
// ================================================================

import type {
  RequestConfig,
  ApiResponse,
  InterceptorChain,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from '../types/api';
import { ApiError } from '../types/api';
import { logError } from '../logger';

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 500;

export class PiRequestClient {
  /** Active per-key abort controllers for deduplication */
  private readonly controllers = new Map<string, AbortController>();

  public readonly interceptors: InterceptorChain = {
    request: [],
    response: [],
    error: [],
  };

  private tokenProvider?: () => string | null | Promise<string | null>;
  private licenseIdProvider?: () => string | null | Promise<string | null>;
  private tokenRefreshHandler?: () => Promise<string | null>;

  setTokenProvider(provider: () => string | null | Promise<string | null>): this {
    this.tokenProvider = provider;
    return this;
  }

  setLicenseIdProvider(provider: () => string | null | Promise<string | null>): this {
    this.licenseIdProvider = provider;
    return this;
  }

  setTokenRefreshHandler(handler: () => Promise<string | null>): this {
    this.tokenRefreshHandler = handler;
    return this;
  }

  // ── Interceptor Registration ───────────────────────────────────────────────

  addRequestInterceptor(fn: RequestInterceptor): this {
    this.interceptors.request.push(fn);
    return this; // fluent
  }

  addResponseInterceptor<T>(fn: ResponseInterceptor<T>): this {
    this.interceptors.response.push(fn as ResponseInterceptor);
    return this;
  }

  addErrorInterceptor(fn: ErrorInterceptor): this {
    this.interceptors.error.push(fn);
    return this;
  }

  // ── Cancellation ──────────────────────────────────────────────────────────

  cancelAll(): void {
    this.controllers.forEach((ctrl) => ctrl.abort());
    this.controllers.clear();
  }

  cancel(key: string): void {
    this.controllers.get(key)?.abort();
    this.controllers.delete(key);
  }

  // ── Core Request ──────────────────────────────────────────────────────────

  async request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
    // 1. Run automatic injection of token and licenseId if providers are configured
    const requestHeaders = { ...config.headers };

    if (this.tokenProvider && !requestHeaders['Authorization']) {
      const token = await this.tokenProvider();
      if (token) requestHeaders['Authorization'] = `Bearer ${token}`;
    }
    if (this.licenseIdProvider && !requestHeaders['X-License-Id']) {
      const licenseId = await this.licenseIdProvider();
      if (licenseId) requestHeaders['X-License-Id'] = licenseId;
    }

    const resolvedConfig = { ...config, headers: requestHeaders };

    // 2. Run request interceptors
    let resolved: RequestConfig = resolvedConfig;
    for (const fn of this.interceptors.request) {
      resolved = await fn(resolved);
    }

    // 2. Per-key deduplication
    const key = resolved.requestKey;
    const controller = new AbortController();

    if (key) {
      this.controllers.get(key)?.abort(); // cancel previous same-key
      this.controllers.set(key, controller);
    }

    // Merge caller-supplied signal
    resolved.signal?.addEventListener('abort', () => controller.abort());

    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
    } = resolved;

    let lastError: ApiError | null = null;
    let tokenRefreshed = false;

    // 3. Retry loop
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (controller.signal.aborted) {
        throw Object.assign(new Error('Request cancelled'), { name: 'AbortError' });
      }

      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const raw = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...(resolved.headers ?? {}) },
          signal: controller.signal,
          ...(body !== undefined && { body: JSON.stringify(body) }),
        });

        clearTimeout(timeoutId);

        // 4. Error handling
        if (!raw.ok) {
          const errBody = (await raw.json().catch(() => ({}))) as Record<string, unknown>;

          // Check if token refresh is supported and retry on 401
          if (raw.status === 401 && this.tokenRefreshHandler && !tokenRefreshed) {
            try {
              tokenRefreshed = true;
              const freshToken = await this.tokenRefreshHandler();
              if (freshToken) {
                resolved.headers = {
                  ...(resolved.headers ?? {}),
                  Authorization: `Bearer ${freshToken}`,
                };
                attempt--; // Don't count refresh retry as a network retry
                continue; // Retry request immediately with the fresh token
              }
            } catch (refreshErr) {
              logError('Token refresh failed inside client request retry', refreshErr);
            }
          }

          // ── 429: distinguish rate-limit vs monthly quota ──────────────────
          if (raw.status === 429) {
            const retryAfterSecs = Number(raw.headers.get('Retry-After') ?? 60);
            const quotaBlock = errBody?.quota as Record<string, unknown> | undefined;
            const errorCode = (errBody?.error as Record<string, unknown>)?.code;
            const isMonthly = quotaBlock?.type === 'monthly' || errorCode === 'insufficient_quota';

            const err429 = new ApiError(
              isMonthly
                ? `Monthly quota exhausted – resets: ${quotaBlock?.reset_date ?? 'unknown'}`
                : `Rate limited – retry in ${retryAfterSecs}s`,
              429,
              {
                type: isMonthly ? 'monthly_quota' : 'rate_limit',
                resetAt: quotaBlock?.reset_date as string | undefined,
                retryAfter: retryAfterSecs,
              },
              errBody
            );

            throw await this.runErrorInterceptors(err429);
          }

          // ── 5xx: retryable ────────────────────────────────────────────────
          if (raw.status >= 500 && attempt < retries) {
            lastError = new ApiError(
              (errBody?.message as string) ?? `Server error ${raw.status}`,
              raw.status,
              undefined,
              errBody
            );
            await this.sleep(retryDelay * 2 ** attempt);
            continue;
          }

          // ── All other errors ──────────────────────────────────────────────
          throw await this.runErrorInterceptors(
            new ApiError(
              (errBody?.message as string) ?? raw.statusText,
              raw.status,
              undefined,
              errBody
            )
          );
        }

        // 5. Success
        const data = (await raw.json()) as T;
        let response: ApiResponse<T> = { data, status: raw.status, headers: raw.headers };

        for (const fn of this.interceptors.response) {
          response = (await (fn as ResponseInterceptor<T>)(response)) ?? response;
        }

        if (key) this.controllers.delete(key);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);

        if ((err as Error).name === 'AbortError') {
          if (key) this.controllers.delete(key);
          throw err;
        }

        if (err instanceof ApiError) {
          if (key) this.controllers.delete(key);
          throw err;
        }

        // Network error – retry
        if (attempt < retries) {
          lastError = new ApiError((err as Error).message ?? 'Network error', 0);
          await this.sleep(retryDelay * 2 ** attempt);
          continue;
        }

        throw new ApiError(`Max retries exceeded: ${(err as Error).message}`, 0);
      }
    }

    throw lastError ?? new ApiError('Unknown request failure', 0);
  }

  // ── Convenience Methods ───────────────────────────────────────────────────

  get<T>(url: string, cfg?: Omit<RequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...cfg, url, method: 'GET' });
  }

  post<T>(
    url: string,
    body?: unknown,
    cfg?: Omit<RequestConfig, 'url' | 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...cfg, url, method: 'POST', body });
  }

  put<T>(
    url: string,
    body?: unknown,
    cfg?: Omit<RequestConfig, 'url' | 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...cfg, url, method: 'PUT', body });
  }

  patch<T>(
    url: string,
    body?: unknown,
    cfg?: Omit<RequestConfig, 'url' | 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...cfg, url, method: 'PATCH', body });
  }

  delete<T>(url: string, cfg?: Omit<RequestConfig, 'url' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...cfg, url, method: 'DELETE' });
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async runErrorInterceptors(error: ApiError): Promise<ApiError> {
    let current = error;
    for (const fn of this.interceptors.error) {
      current = (await fn(current)) ?? current;
    }
    return current;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
