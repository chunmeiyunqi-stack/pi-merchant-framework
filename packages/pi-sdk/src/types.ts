// ============================================================
// Pi Merchant Framework — Pi SDK 类型定义
// 基于 Pi Network 官方 JS SDK 类型
// ============================================================

// ---- Pi SDK 全局注入类型 ----

/** Pi 用户认证结果 */
export interface PiAuthResult {
  accessToken: string;
  user: PiUser;
}

/** Pi 用户信息 */
export interface PiUser {
  uid: string;
  username: string;
}

/** Pi 支付数据（创建支付时传入） */
export interface PiPaymentData {
  amount: number;   // 以 Pi 为单位，最多 7 位小数
  memo: string;     // 用户可见的支付说明（最多 128 字符）
  metadata: Record<string, unknown>; // 开发者自定义元数据（不对用户显示）
}

/** Pi Platform API 返回的支付对象 */
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

/** Pi SDK 回调集合 */
export interface PiPaymentCallbacks {
  /** 支付准备好等待服务器审批时触发 */
  onReadyForServerApproval: (paymentId: string) => void;
  /** 用户在 Pi 钱包确认后，链上交易完成时触发 */
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  /** 支付取消时触发 */
  onCancel: (paymentId: string) => void;
  /** 发现未完成的旧支付时触发 */
  onError: (error: Error, payment?: PiPaymentDTO) => void;
}

/** Pi.authenticate 的 scope 枚举 */
export type PiScope = 'username' | 'payments' | 'wallet_address';

// ---- 内部业务类型 ----

/** 订单状态枚举（与 Prisma OrderStatus 保持一致） */
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

/** 内部支付记录 */
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

/** 审批请求体 */
export interface ApprovePaymentRequest {
  paymentId: string;
  orderId?: string;
}

/** 审批响应体 */
export interface ApprovePaymentResponse {
  success: boolean;
  payment?: PiPaymentDTO;
  error?: string;
}

/** 完成请求体 */
export interface CompletePaymentRequest {
  paymentId: string;
  txid: string;
  orderId?: string;
}

/** 完成响应体 */
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

/** Pi 认证请求体 */
export interface PiAuthRequest {
  accessToken: string;
  merchantId: string;
}

/** Pi 认证响应体 */
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

/** 全局 Pi 对象类型（挂载在 window 上） */
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
