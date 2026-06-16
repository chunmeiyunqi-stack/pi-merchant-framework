import client from 'prom-client';

// Register default metrics (optional)
client.collectDefaultMetrics();

// Counters
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
});

export const aiProviderRequestsTotal = new client.Counter({
  name: 'ai_provider_requests_total',
  help: 'AI provider requests total',
  labelNames: ['provider', 'model', 'success'],
});

export const aiFallbackActivationsTotal = new client.Counter({
  name: 'ai_fallback_activations_total',
  help: 'AI fallback activations total',
  labelNames: ['from_provider', 'to_provider'],
});

export const rateLimitHitsTotal = new client.Counter({
  name: 'rate_limit_hits_total',
  help: 'Rate limit hits total',
  labelNames: ['identifier', 'endpoint'],
});

// Histogram for request durations
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// Gauge for active sessions
export const activeSessions = new client.Gauge({
  name: 'active_sessions',
  help: 'Number of active sessions',
});

// Helper middleware for Next.js / Node.js to measure requests
export function startTimer(method: string, path: string) {
  return httpRequestDurationSeconds.startTimer({ method, path });
}

export default client;
