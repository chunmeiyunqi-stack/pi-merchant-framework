// Lazy-load metrics implementation to avoid importing Node-only `prom-client`
// in environments where it is not available (Edge runtime, etc.). If
// metrics cannot be loaded, gracefully degrade to no-op counters/timers.
type MetricsModule = {
  httpRequestsTotal?: any;
  startTimer?: (method: string, path: string) => () => void;
};
async function loadMetrics(): Promise<MetricsModule> {
  try {
    const m = await import('./metrics');
    return { httpRequestsTotal: m.httpRequestsTotal, startTimer: m.startTimer };
  } catch (e) {
    return {};
  }
}
// Generic wrapper compatible with various Next.js App Router route handler signatures.
export function withMetrics<Args extends any[], R>(
  handler: (...args: Args) => Promise<R> | R
): (...args: Args) => Promise<R> {
  return async (...args: Args): Promise<R> => {
    const req = args[0] as any;
    // If running in Edge runtime, do not attempt to load Node-only metrics modules.
    const isEdgeRuntime =
      typeof process === 'undefined' ||
      (typeof process !== 'undefined' &&
        (process as any).env &&
        (process as any).env.NEXT_RUNTIME === 'edge');
    if (isEdgeRuntime) {
      return handler(...args);
    }
    const method: string = req && typeof req.method === 'string' ? req.method : 'GET';
    const urlStr: string = req && typeof req.url === 'string' ? req.url : 'http://localhost/';
    let path = '/';
    try {
      const url = new URL(urlStr);
      path = url.pathname;
    } catch {
      path = typeof req === 'string' ? req : '/';
    }
    const metrics = await loadMetrics();
    try {
      metrics.httpRequestsTotal?.inc({ method, path, status_code: 'unknown' });
    } catch {}
    const end = metrics.startTimer ? metrics.startTimer(method, path) : () => {};
    try {
      const res = await handler(...args);
      try {
        const status =
          res && typeof (res as any).status === 'number' ? String((res as any).status) : '200';
        metrics.httpRequestsTotal?.inc({ method, path, status_code: status });
      } catch (e) {
        // ignore
      }
      end();
      return res as R;
    } catch (err) {
      end();
      try {
        metrics.httpRequestsTotal?.inc({ method, path, status_code: '500' });
      } catch {}
      throw err;
    }
  };
}
