// Lightweight no-op AI metrics helpers to avoid build-time errors when
// provider-specific instrumentation is not present in the environment.
export function recordAiProviderCall(provider: string, model: string, success: boolean) {
  try {
    // no-op: metric recording may be implemented by prom-client-backed module
    // in production; keep a silent no-op here for local dev and tests.
  } catch (e) {}
}

export function recordAiFallback(fromProvider: string, toProvider: string) {
  try {
    // no-op fallback recorder
  } catch (e) {}
}

// Keep this file intentionally lightweight and idempotent for testing environments.
