// ============================================================
// Pi Merchant Framework 鈥?Pi SDK 绫诲瀷瀹氫箟
// 鍩轰簬 Pi Network 瀹樻柟 JS SDK 绫诲瀷
// ============================================================

// ---- Pi SDK 鍏ㄥ眬娉ㄥ叆绫诲瀷 ----

/** Pi 鐢ㄦ埛璁よ瘉缁撴灉 */
export interface PiAuthResult {
  accessToken?: string;
  user: PiUser;
}

/** Pi 鐢ㄦ埛淇℃伅 */
export interface PiUser {
  uid: string;
  username: string;
}

/** Pi 鏀粯鏁版嵁锛堝垱寤烘敮浠樻椂浼犲叆锛?*/
export interface PiPaymentData {
  amount: number;   // 浠?Pi 涓哄崟浣嶏紝鏈€澶?7 浣嶅皬鏁?  memo: string;     // 鐢ㄦ埛鍙鐨勬敮浠樿鏄庯紙鏈€澶?128 瀛楃锛?  metadata: Record<string, unknown>; // 寮€鍙戣€呰嚜瀹氫箟鍏冩暟鎹紙涓嶅鐢ㄦ埛鏄剧ず锛?}

/** Pi Platform API 杩斿洖鐨勬敮浠樺璞?*/
export interface PiPaymentDTO {
  identifier: string;         // = paymentId
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
  transaction: null | {
    txid: string;
    verified: boolean;
    _link: string;
  };
}

/** Pi SDK 鍥炶皟闆嗗悎 */
export interface PiPaymentCallbacks {
  /** 鏀粯鍑嗗濂界瓑寰呮湇鍔″櫒瀹℃壒鏃惰Е鍙?*/
  onReadyForServerApproval: (paymentId: string) => void;
  /** 鐢ㄦ埛鍦?Pi 閽卞寘纭鍚庯紝閾句笂浜ゆ槗瀹屾垚鏃惰Е鍙?*/
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  /** 鏀粯鍙栨秷鏃惰Е鍙?*/
  onCancel: (paymentId: string) => void;
  /** 鍙戠幇鏈畬鎴愮殑鏃ф敮浠樻椂瑙﹀彂 */
  onError: (error: Error, payment?: PiPaymentDTO) => void;
}

/** Pi.authenticate 鐨?scope 鏋氫妇 */
export type PiScope = 'username' | 'payments' | 'wallet_address';

// ---- 鍐呴儴涓氬姟绫诲瀷 ----

/** 璁㈠崟鐘舵€佹灇涓撅紙涓?Prisma OrderStatus 淇濇寔涓€鑷达級 */
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

/** 鍐呴儴鏀粯璁板綍 */
export interface PaymentRecord {
  id: string;
  orderId?: string;
  piPaymentId: string;
  txid?: string;
  amount: number;
  memo: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  developerApproved: boolean;
  transactionVerified: boolean;
  developerCompleted: boolean;
  userCancelled: boolean;
  createdAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
}

/** 瀹℃壒璇锋眰浣?*/
export interface ApprovePaymentRequest {
  paymentId: string;
  orderId?: string;
}

/** 瀹℃壒鍝嶅簲浣?*/
export interface ApprovePaymentResponse {
  success: boolean;
  payment?: PiPaymentDTO;
  error?: string;
}

/** 瀹屾垚璇锋眰浣?*/
export interface CompletePaymentRequest {
  paymentId: string;
  txid: string;
  orderId?: string;
}

/** 瀹屾垚鍝嶅簲浣?*/
export interface CompletePaymentResponse {
  success: boolean;
  payment?: PiPaymentDTO;
  order?: {
    id: string;
    status: OrderStatus;
    orderNo: string;
  };
  error?: string;
}

/** Pi 璁よ瘉璇锋眰浣?*/
export interface PiAuthRequest {
  accessToken?: string;
  merchantId: string;
}

/** Pi 璁よ瘉鍝嶅簲浣?*/
export interface PiAuthResponse {
  success: boolean;
  user?: {
    id: string;
    piUid: string;
    username: string;
    displayName?: string;
    membershipStatus?: string;
  };
  sessionToken?: string;
  error?: string;
}

/** 鍏ㄥ眬 Pi 瀵硅薄绫诲瀷锛堟寕杞藉湪 window 涓婏級 */
export interface PiSDK {
  authenticate(
    scopes: PiScope[],
    onIncompletePaymentFound: (payment: PiPaymentDTO) => void
  ): Promise<PiAuthResult>;

  createPayment(
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ): void;

  openShareDialog(title: string, message: string): void;
}

declare global {
  interface Window {
    Pi: PiSDK;
  }
}

