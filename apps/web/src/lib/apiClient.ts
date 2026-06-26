import { toast } from 'sonner';
// ================================================================
// PiMerchantFramework — Configured API Client Singleton
// apps/web/src/lib/apiClient.ts
//
// Sets up the global PiRequestClient with:
//   1. Auth interceptor (Bearer token from localStorage / cookie)
//   2. Rate-limit interceptor (toast callbacks)
//   3. 401 auto-redirect interceptor (clear token → /login)
//
// Usage in any Client Component:
//   import { piClient } from '@/lib/apiClient';
//   const { data } = await piClient.get<Item[]>('/api/items');
//
// Usage in Server Component / API Route:
//   import { getPiClient } from '@/lib/apiClient';
//   const client = getPiClient();
// ================================================================
'use client';

import {
  PiRequestClient,
  createAuthInterceptor,
  createRateLimitInterceptor,
  ApiError,
} from '@pi-merchant/pi-sdk';

// ─── Token Provider ───────────────────────────────────────────────────────────

/**
 * Reads the access token from localStorage first, then falls back to cookie.
 * Returns null on SSR (safe – interceptor will skip the header).
 */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1) localStorage
  const lsToken = localStorage.getItem('pi_access_token');
  if (lsToken) return lsToken;

  // 2) cookie fallback
  const cookieToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('pi_access_token='))
    ?.split('=')[1];

  return cookieToken ?? null;
}

// ─── Client Factory ───────────────────────────────────────────────────────────

function buildPiClient(): PiRequestClient {
  const client = new PiRequestClient();

  // ── 1. Auth: inject Bearer token ─────────────────────────────────────────
  client.addRequestInterceptor(createAuthInterceptor(getStoredToken));

  // ── 2. Rate-limit / quota: toast notifications ────────────────────────────
  client.addErrorInterceptor(
    createRateLimitInterceptor({
      onRateLimit: (retryAfter: number) => {
        // TODO: replace console.warn with your toast library
        // e.g. toast.warning(`Too many requests – retry in ${retryAfter}s`)
        toast.warning(`⏱ 请求过快，稍后重试`);
      },
      onQuotaExhausted: (resetAt: string | undefined) => {
        // e.g. toast.error(`Monthly API quota exhausted. Resets: ${resetAt}`)
        toast.error(`📦 API 月度配额耗尽，请联系管理员`);
      },
    }),
  );

  // ── 3. 401: clear token + redirect to /login ──────────────────────────────
  client.addErrorInterceptor((error: ApiError): never => {
    if (error.isUnauthorized() && typeof window !== 'undefined') {
      localStorage.removeItem('pi_access_token');
      // Preserve current path so /login can redirect back after re-auth
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?returnUrl=${returnUrl}`;
    }
    throw error;
  });

  return client;
}

// ─── Singleton Management ─────────────────────────────────────────────────────

let _clientSingleton: PiRequestClient | null = null;

/**
 * Returns the shared client instance (browser) or a fresh instance (SSR).
 * SSR instances are intentionally NOT cached to avoid cross-request token leaks.
 */
export function getPiClient(): PiRequestClient {
  if (typeof window === 'undefined') {
    // Server-side: always a fresh, unshared instance
    return buildPiClient();
  }
  if (!_clientSingleton) {
    _clientSingleton = buildPiClient();
  }
  return _clientSingleton;
}

// ─── Convenience API (mirrors piClient.method() pattern) ─────────────────────

type GetCfg    = Parameters<PiRequestClient['get']>[1];
type PostCfg   = Parameters<PiRequestClient['post']>[2];
type PutCfg    = Parameters<PiRequestClient['put']>[2];
type PatchCfg  = Parameters<PiRequestClient['patch']>[2];
type DeleteCfg = Parameters<PiRequestClient['delete']>[1];

export const piClient = {
  get:    <T>(url: string, cfg?: GetCfg)                        => getPiClient().get<T>(url, cfg),
  post:   <T>(url: string, body?: unknown, cfg?: PostCfg)       => getPiClient().post<T>(url, body, cfg),
  put:    <T>(url: string, body?: unknown, cfg?: PutCfg)        => getPiClient().put<T>(url, body, cfg),
  patch:  <T>(url: string, body?: unknown, cfg?: PatchCfg)      => getPiClient().patch<T>(url, body, cfg),
  delete: <T>(url: string, cfg?: DeleteCfg)                     => getPiClient().delete<T>(url, cfg),
  cancel: (key: string)                                         => getPiClient().cancel(key),
  cancelAll: ()                                                 => getPiClient().cancelAll(),
} as const;



