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
  accessToken: string;
  merchantId: string;
}

export interface PiAuthResponse {
  user?: PiUser;
  error?: string;
  success: boolean;
  customerId?: string;
  username?: string;
  message?: string;
}

