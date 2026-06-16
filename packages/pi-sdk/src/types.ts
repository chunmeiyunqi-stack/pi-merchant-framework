// Pi SDK Type Definitions

export interface PiAuthResult {
  accessToken?: string;
  user: PiUser;
  token?: string;
}

export interface PiUser {
  uid: string;
  username: string;
}

/** AI 模型标识 — 开放为 string 以支持所有提供商的模型名称 */
export type AIModel = string;

export interface AIRequest {
  merchantId: string;
  prompt: string;
  model?: AIModel;
  temperature?: number;
  /** 指定 AI 提供商（可选，不传则使用环境变量 AI_PRIMARY_PROVIDER 配置） */
  provider?: 'openai' | 'anthropic' | 'ollama';
}

export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
  /** 实际使用的 AI 提供商 */
  provider?: string;
  /** 实际使用的模型名称 */
  model?: string;
  /** Optional routing metadata including fallback info */
  routing?: {
    requested?: string;
    actual?: string;
    fallback?: boolean;
  };
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

export interface PiPaymentDTO {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  from_address: string;
  to_address: string;
  direction: 'user_to_app' | 'app_to_user';
  created_at: string;
  network: 'Pi Network' | 'Pi Testnet';
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction: {
    txid: string;
    verified: boolean;
    _link: string;
  } | null;
}

export type PiScope = 'username' | 'payments' | 'wallet_address';

export interface PiAuthRequest {
  accessToken?: string;
  piUid: string;
  username: string;
  merchantId: string;
}

export interface PiAuthResponse {
  success: boolean;
  user?: PiUser;
  customerId?: string;
  username?: string;
  message?: string;
  error?: string;
  token?: string;
}

export interface ApprovePaymentRequest {
  paymentId: string;
  orderId?: string;
  merchantId?: string;
}

export interface ApprovePaymentResponse {
  success: boolean;
  paymentId?: string;
  message?: string;
  error?: string;
}

export interface CompletePaymentRequest {
  paymentId: string;
  txid: string;
  orderId?: string;
  merchantId?: string;
}

export interface CompletePaymentResponse {
  success: boolean;
  paymentId?: string;
  txid?: string;
  message?: string;
  error?: string;
}

export interface CreatePaymentRequest {
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
  merchantId?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  paymentId?: string;
  message?: string;
  error?: string;
}
