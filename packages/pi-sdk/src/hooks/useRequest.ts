// ================================================================
// PiMerchantFramework — Universal Async Request Hook
// packages/pi-sdk/src/hooks/useRequest.ts
// ================================================================
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResponse } from '../types/api';
import { ApiError } from '../types/api';

export interface UseRequestState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseRequestOptions<T> {
  /** Called on every successful response */
  onSuccess?: (data: T) => void;
  /** Called on every error (excluding AbortError) */
  onError?: (error: ApiError) => void;
  /** If true, execute is called automatically on mount */
  immediate?: boolean;
}

export interface UseRequestReturn<T, A extends unknown[]> extends UseRequestState<T> {
  /** Fire the request with given args */
  execute: (...args: A) => Promise<T | null>;
  /** Abort in-flight request (sets loading = false) */
  cancel: () => void;
  /** Reset state to initial and cancel in-flight request */
  reset: () => void;
}

/**
 * Universal hook that wraps any async request function with:
 * - Automatic cancellation on unmount
 * - Cancellation of previous call when a new one starts
 * - Structured `data / loading / error` state
 * - Stable `execute` reference (safe as useEffect dependency)
 *
 * Usage:
 * ```tsx
 * const { data, loading, error, execute } = useRequest(
 *   (type: string) =>
 *     piClient.get<HistoryItem[]>(`/api/history?type=${type}`, {
 *       requestKey: 'history-fetch',
 *     }),
 * );
 *
 * useEffect(() => { execute('payment'); }, [execute]);
 * ```
 */
export function useRequest<T, A extends unknown[] = []>(
  requestFn: (...args: A) => Promise<ApiResponse<T>>,
  options: UseRequestOptions<T> = {}
): UseRequestReturn<T, A> {
  const [state, setState] = useState<UseRequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Refs keep latest values without re-creating `execute`
  const fnRef = useRef(requestFn);
  const optsRef = useRef(options);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    fnRef.current = requestFn;
  }, [requestFn]);
  useEffect(() => {
    optsRef.current = options;
  }, [options]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Stable execute — deps array is intentionally empty; uses refs internally
  const execute = useCallback(async (...args: A): Promise<T | null> => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((prev: UseRequestState<T>) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fnRef.current(...args);
      if (!mountedRef.current) return null;

      setState({ data: response.data, loading: false, error: null });
      optsRef.current.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      if (!mountedRef.current) return null;

      // Silent cancel — do not surface as error
      if ((err as Error).name === 'AbortError') {
        setState((prev: UseRequestState<T>) => ({ ...prev, loading: false }));
        return null;
      }

      // Ensure it's an ApiError (wrap raw errors)
      const apiError: ApiError =
        err instanceof ApiError ? err : new ApiError((err as Error).message ?? 'Unknown error', 0);

      setState({ data: null, loading: false, error: apiError });
      optsRef.current.onError?.(apiError);
      return null;
    }
  }, []); // stable – refs handle stale closure

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((prev: UseRequestState<T>) => ({ ...prev, loading: false }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ data: null, loading: false, error: null });
  }, []);

  // Auto-execute on mount if requested
  const immediateRef = useRef(options.immediate);
  useEffect(() => {
    if (immediateRef.current) {
      void execute(...([] as unknown as A));
    }
  }, [execute]);

  return { ...state, execute, cancel, reset };
}
