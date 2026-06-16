// No-op AI metrics helpers for web app runtime (local/dev).
export function recordAiProviderCall(provider: string, model: string, success: boolean) {
  try {
    // intentionally no-op for local dev
  } catch (e) {}
}

export function recordAiFallback(fromProvider: string, toProvider: string) {
  try {
  } catch (e) {}
}

export default {};
