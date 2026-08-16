// packages/pi-sdk/src/index.ts
// Pi SDK 灏佽灞傜粺涓€瀵煎嚭鍏ュ彛

import { validateEnv } from './env-validator';

// 鑷姩鎵ц鐜鍙橀噺鏍￠獙
validateEnv();

export * from './types';
export * from './payment-service';
export * from './auth-service';
export * from './ai-service';
export * from './logger';
export * from './ai-providers';

// Phase 3.2: 鍟嗕笟鍖栨牳蹇冭兘鍔?export * from './license';
export * from './usage';
export * from './tenant';

// ─── V2.1.0 新增: 中间件层导出 ───────────────────────────────
export { PiRequestClient } from './client/request';

export { createAuthInterceptor, createRefreshingAuthInterceptor } from './interceptors/auth';
export type { TokenProvider } from './interceptors/auth';

export { createRateLimitInterceptor, createAutoRetryInterceptor } from './interceptors/rateLimit';
export type { RateLimitCallbacks } from './interceptors/rateLimit';

// useRequest 为 React Hook，只能用于客户端组件，不能从服务端 SDK 主入口导出，
// 否则会被打包进 Server Component 导致 Next.js 构建失败（useEffect/useState 等）。
// export { useRequest } from './hooks/useRequest';
// export type { UseRequestReturn, UseRequestState, UseRequestOptions } from './hooks/useRequest';

export { ApiError } from './types/api';
export type {
  HttpMethod,
  RequestConfig,
  ApiResponse,
  QuotaInfo,
  InterceptorChain,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from './types/api';

// ─── License ─────────────────────────────────
export * from './license/manager';

// ─── License (V2.1.0) ────────────────────────────────────────────────
export { deserializeLicense, validateLicense } from './license';
export type { SerializedLicense, LicenseValidationResult } from './license';

// ─── Payment Webhook Signature Verification ───────────────────
export { verifyPaymentSignature } from './payment/verify';
