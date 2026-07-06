// ================================================================
// PiMerchantFramework — Auth Request Interceptor
// packages/pi-sdk/src/interceptors/auth.ts
// ================================================================

import type { RequestInterceptor } from '../types/api';

/** Sync or async token getter – return null to skip auth header */
export type TokenProvider = () => string | null | Promise<string | null>;

/**
 * Injects `Authorization: Bearer <token>` into every outgoing request.
 *
 * Usage:
 * ```ts
 * client.addRequestInterceptor(
 *   createAuthInterceptor(() => localStorage.getItem('pi_access_token'))
 * );
 * ```
 */
export function createAuthInterceptor(getToken: TokenProvider): RequestInterceptor {
  return async (config) => {
    const token = await getToken();
    if (!token) return config;

    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  };
}

/**
 * Variant that supports token refresh: retries once with a fresh token
 * when the first attempt returns 401.
 *
 * Usage (advanced):
 * ```ts
 * client.addRequestInterceptor(
 *   createRefreshingAuthInterceptor(getToken, refreshToken)
 * );
 * ```
 */
export function createRefreshingAuthInterceptor(
  getToken: TokenProvider,
  refreshToken: () => Promise<string | null>,
): RequestInterceptor {
  let refreshPromise: Promise<string | null> | null = null;

  return async (config) => {
    // If a refresh is already in-flight, wait for it (dedup concurrent refreshes)
    if (refreshPromise) {
      const newToken = await refreshPromise;
      return newToken
        ? { ...config, headers: { ...config.headers, Authorization: `Bearer ${newToken}` } }
        : config;
    }

    const token = await getToken();
    if (!token) {
      // No token at all – try refresh once
      refreshPromise = refreshToken().finally(() => { refreshPromise = null; });
      const fresh = await refreshPromise;
      return fresh
        ? { ...config, headers: { ...config.headers, Authorization: `Bearer ${fresh}` } }
        : config;
    }

    return {
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${token}` },
    };
  };
}
