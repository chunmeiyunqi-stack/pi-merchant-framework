// ============================================================
// Pi Merchant Framework — Pi 支付服务封装
//
// 封装 Pi Network U2A (User-to-App) 完整支付流程：
//   1. 前端调用 Pi.createPayment()
//   2. onReadyForServerApproval → POST /api/payments/approve
//   3. 用户在 Pi 钱包确认
//   4. onReadyForServerCompletion → POST /api/payments/complete
//
// 所有支付逻辑必须走这里，禁止写进页面组件
// ============================================================

import type {
  PiPaymentData,
  PiPaymentDTO,
  ApprovePaymentRequest,
  ApprovePaymentResponse,
  CompletePaymentRequest,
  CompletePaymentResponse,
} from './types';

// ---- 配置 ----

const API_BASE = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');

// ============================================================
// 核心：createPayment
// 触发 Pi U2A 支付，绑定完整回调链
// ============================================================

/**
 * 发起 Pi U2A 支付
 * @param paymentData  - 支付数据（amount/memo/metadata）
 * @param orderId      - 本地订单 ID（用于关联）
 * @param onSuccess    - 支付完整成功回调（含 txid）
 * @param onFailed     - 支付失败/取消回调
 */
export function createPayment(
  paymentData: PiPaymentData,
  orderId: string,
  onSuccess: (paymentId: string, txid: string) => void,
  onFailed: (reason: string) => void
): void {
  if (typeof window === 'undefined' || !window.Pi) {
    console.error('[PiPayment] Pi SDK 未加载，请确保在 Pi Browser 中运行');
    onFailed('Pi SDK not available');
    return;
  }

  window.Pi.createPayment(paymentData, {
    /**
     * 步骤 2：支付准备好等待后端审批
     * 立即将 paymentId 发送给后端进行审批
     */
    onReadyForServerApproval: async (paymentId: string) => {
      console.log('[PiPayment] onReadyForServerApproval:', paymentId);
      try {
        await approvePayment({ paymentId, orderId });
      } catch (err) {
        console.error('[PiPayment] 审批失败:', err);
        onFailed(`Approval failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    },

    /**
     * 步骤 4：链上交易完成，等待后端 complete
     * 将 paymentId + txid 发送给后端完成支付
     */
    onReadyForServerCompletion: async (paymentId: string, txid: string) => {
      console.log('[PiPayment] onReadyForServerCompletion:', { paymentId, txid });
      try {
        const result = await completePayment({ paymentId, txid, orderId });
        if (result.success) {
          onSuccess(paymentId, txid);
        } else {
          onFailed(result.error ?? 'Completion failed');
        }
      } catch (err) {
        console.error('[PiPayment] 完成支付失败:', err);
        onFailed(`Completion failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    },

    /**
     * 用户在 Pi 钱包中取消了支付
     */
    onCancel: (paymentId: string) => {
      console.warn('[PiPayment] 用户取消支付:', paymentId);
      cancelPayment(paymentId).catch(console.error);
      onFailed('Payment cancelled by user');
    },

    /**
     * SDK 内部错误
     */
    onError: (error: Error, payment?: PiPaymentDTO) => {
      console.error('[PiPayment] SDK 错误:', error, payment);
      onFailed(error.message ?? 'Unknown SDK error');
    },
  });
}

// ============================================================
// approvePayment
// 调用 POST /api/payments/approve
// 后端再调用 Pi Platform API: POST /v2/payments/{paymentId}/approve
// ============================================================

/**
 * 后端审批支付（Server Approval）
 * @param req - { paymentId, orderId }
 */
export async function approvePayment(
  req: ApprovePaymentRequest
): Promise<ApprovePaymentResponse> {
  const response = await fetch(`${API_BASE}/api/payments/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Approve API error ${response.status}: ${error}`);
  }

  return response.json() as Promise<ApprovePaymentResponse>;
}

// ============================================================
// completePayment
// 调用 POST /api/payments/complete
// 后端再调用 Pi Platform API: POST /v2/payments/{paymentId}/complete
// ============================================================

/**
 * 后端完成支付（Server Completion）
 * @param req - { paymentId, txid, orderId }
 */
export async function completePayment(
  req: CompletePaymentRequest
): Promise<CompletePaymentResponse> {
  const response = await fetch(`${API_BASE}/api/payments/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Complete API error ${response.status}: ${error}`);
  }

  return response.json() as Promise<CompletePaymentResponse>;
}

// ============================================================
// handleIncompletePayment
// 处理 Pi.authenticate 发现的未完成支付
// 防止同一用户重复支付或卡单
// ============================================================

/**
 * 处理未完成支付（在 Pi.authenticate 的回调中调用）
 * Pi SDK 在发现上次未完成的支付时触发此函数
 * @param payment - Pi Platform 返回的支付对象
 */
export async function handleIncompletePayment(
  payment: PiPaymentDTO
): Promise<void> {
  const { identifier: paymentId, status, transaction } = payment;
  console.log('[PiPayment] 发现未完成支付:', paymentId, status);

  try {
    if (!status.developer_approved) {
      // 未审批：重新审批
      console.log('[PiPayment] 重新审批未完成支付...');
      await approvePayment({ paymentId });
    } else if (status.developer_approved && !status.developer_completed && transaction?.txid) {
      // 已审批但未完成：重新完成
      console.log('[PiPayment] 重新完成未完成支付...');
      await completePayment({ paymentId, txid: transaction.txid });
    } else if (status.user_cancelled || status.cancelled) {
      // 已取消：更新本地状态
      console.log('[PiPayment] 支付已取消，同步本地状态...');
      await cancelPayment(paymentId);
    } else {
      console.warn('[PiPayment] 未知支付状态，跳过处理:', status);
    }
  } catch (err) {
    console.error('[PiPayment] 处理未完成支付失败:', err);
  }
}

// ============================================================
// cancelPayment
// 本地标记支付为取消状态
// ============================================================

/**
 * 取消支付（通知后端更新状态）
 * @param paymentId - Pi Platform 支付 ID
 */
export async function cancelPayment(paymentId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/payments/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[PiPayment] 取消支付 API 失败:', response.status);
    }
  } catch (err) {
    console.error('[PiPayment] 通知取消支付失败:', err);
  }
}

// ============================================================
// 支付状态机工具函数
// ============================================================

/**
 * 根据 Pi 支付 DTO 推导订单状态
 */
export function deriveOrderStatusFromPayment(
  payment: PiPaymentDTO
): 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' {
  const s = payment.status;
  if (s.developer_completed && s.transaction_verified) return 'COMPLETED';
  if (s.developer_approved) return 'APPROVED';
  if (s.user_cancelled || s.cancelled) return 'CANCELLED';
  return 'PENDING_APPROVAL';
}
