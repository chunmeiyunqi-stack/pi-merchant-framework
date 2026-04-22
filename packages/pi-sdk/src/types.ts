// Pi SDK Type Definitions

export interface PiAuthResult {
  accessToken?: string;
  user: PiUser;
}

export interface PiUser {
  uid: string;
  username: string;
}

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
