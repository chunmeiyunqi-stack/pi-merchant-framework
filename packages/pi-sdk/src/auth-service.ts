// ============================================================
// Pi Merchant Framework — Pi 认证服务封装
//
// Pi 用户认证流程：
//   1. 前端调用 Pi.authenticate(scopes, onIncompletePaymentFound)
//   2. 获取 authResult.accessToken
//   3. POST /api/auth/pi（传入 accessToken）
//   4. 后端验证 token → 查询/创建 customer 记录 → 返回 session
// ============================================================

import type {
  PiAuthResult,
  PiAuthResponse,
  PiAuthRequest,
  PiScope,
  PiPaymentDTO,
} from './types';
import { handleIncompletePayment } from './payment-service';

const API_BASE = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');

// ============================================================
// authenticateWithPi
// 完整的前端认证入口，包含未完成支付处理
// ============================================================

/**
 * 触发 Pi 认证，返回后端 session 信息
 * @param merchantId - 当前商户 ID
 * @param scopes     - 请求的权限范围（至少 username + payments）
 */
export async function authenticateWithPi(
  merchantId: string,
  scopes: PiScope[] = ['username', 'payments']
): Promise<PiAuthResponse> {
  if (typeof window === 'undefined' || !window.Pi) {
    throw new Error('Pi SDK 未加载，请在 Pi Browser 中打开此应用');
  }

  // 步骤 1：调用 Pi SDK authenticate
  let authResult: PiAuthResult;
  try {
    authResult = await window.Pi.authenticate(scopes, async (payment: PiPaymentDTO) => {
      // 发现未完成支付时自动处理（防止用户被卡单）
      console.log('[PiAuth] 发现未完成支付，开始处理...');
      await handleIncompletePayment(payment);
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Pi 认证失败';
    console.error('[PiAuth] authenticate 失败:', err);
    throw new Error(msg);
  }

  // 步骤 3：将 accessToken 发送到后端验证
  return verifyAccessTokenWithBackend({
    accessToken: authResult.accessToken,
    merchantId,
  });
}

// ============================================================
// verifyAccessTokenWithBackend
// 调用 POST /api/auth/pi 进行后端验证
// ============================================================

/**
 * 将 Pi accessToken 发送到后端换取 session
 * @param req - { accessToken, merchantId }
 */
export async function verifyAccessTokenWithBackend(
  req: PiAuthRequest
): Promise<PiAuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/pi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    credentials: 'include', // 携带 cookie session
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`认证 API 错误 ${response.status}: ${error}`);
  }

  return response.json() as Promise<PiAuthResponse>;
}

// ============================================================
// getCurrentUser
// 从后端获取当前登录用户信息
// ============================================================

/**
 * 获取当前会话用户信息（后端从 cookie/session 读取）
 */
export async function getCurrentUser(): Promise<PiAuthResponse['user'] | null> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json() as { user: PiAuthResponse['user'] };
    return data.user ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// signOut
// 清除会话
// ============================================================

/**
 * 退出登录，清除后端 session
 */
export async function signOut(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
