'use client';

export const PI_AUTH_TOKEN_COOKIE = 'pi_auth_token';
export const PI_AUTH_TOKEN_FALLBACK_STORAGE_KEY = 'pi_auth_token';

function readFallbackToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(PI_AUTH_TOKEN_FALLBACK_STORAGE_KEY) || '';
}

export function getPiAuthToken(): string {
  return readFallbackToken();
}

export function buildPiAuthHeaders(extraHeaders: HeadersInit = {}): Headers {
  const headers = new Headers(extraHeaders);
  const token = getPiAuthToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

export async function fetchWithPiAuth(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = buildPiAuthHeaders(init.headers ?? {});
  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  });
}

export function storePiAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PI_AUTH_TOKEN_FALLBACK_STORAGE_KEY, token);
}
