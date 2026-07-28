'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchWithPiAuth, storePiAuthToken } from '@/lib/apiClient';

type PlanKey = 'basic6' | 'basic12' | 'custom';

type Plan = {
  name: string;
  amount: number;
  duration: string;
};

type OrderResponse =
  | {
      success: true;
      order: {
        orderNo: string;
      };
    }
  | {
      success: false;
      error?: string;
    };

const PLANS: Record<PlanKey, Plan> = {
  basic6:  { name: '初级服务 (6个月)',    amount: 50, duration: '6个月' },
  basic12: { name: '初级服务 (12个月)',   amount: 90, duration: '12个月' },
  custom:  { name: '全套订阅 (自定义)',   amount: 0,  duration: '自定义' },
};

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const planParam = searchParams?.get('plan');

  // 如果 plan=custom 或带 amount 参数，启用自定义模式
  const isCustom = planParam === 'custom';
  const initPlan = (isCustom ? 'custom' : (planParam ?? 'basic6')) as PlanKey;
  const plan = PLANS[initPlan] ?? PLANS.basic6;

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState(plan.amount || 0);

  const selectedPlan = plan;
  const finalAmount = isCustom ? customAmount : plan.amount;

  // 一键完成：身份验证 → 创建订单 → 唤醒支付
  const handlePay = async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      setErrorStatus('⚠️ 请在 Pi Browser 中打开此页面。');
      return;
    }

    if (isCustom && finalAmount <= 0) {
      setErrorStatus('⚠️ 请输入有效的 π 数量。');
      return;
    }

    setLoading(true);
    setErrorStatus(null);

    try {
      // 步骤 0: Pi 身份验证（含 payments scope + 未完成支付处理）
      setStatusText('正在验证 Pi 身份...');
      const scopes: ('username' | 'payments')[] = ['username', 'payments'];

      const auth = await window.Pi.authenticate(scopes, async (payment: any) => {
        if (payment?.transaction?.txid) {
          await fetch('/api/payments/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction.txid }),
          });
        }
      });

      // 通知后端验证并存储 token
      const authRes = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          piUid: auth.user.uid,
          username: auth.user.username,
        }),
      });
      const authData = await authRes.json();
      if (authData.token) storePiAuthToken(authData.token);

      // 步骤 1: 创建订单
      setStatusText('正在生成订单...');
      const orderRes = await fetchWithPiAuth('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          planId: initPlan,
          memo: `Framework: ${selectedPlan.name}`,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        setErrorStatus(orderRes.status === 401
          ? '身份未授权，请返回首页重新登录。'
          : '创建订单失败: ' + (orderData.error ?? '未知错误'));
        setLoading(false);
        return;
      }

      // 步骤 2: 唤醒 Pi Wallet 支付
      setStatusText('正在打开 Pi Wallet...');
      window.Pi.createPayment(
        {
          amount: finalAmount,
          memo: selectedPlan.name,
          metadata: { orderId: orderData.order.orderNo, planId: initPlan },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            setStatusText('审批中...');
            await fetchWithPiAuth('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, orderId: orderData.order.orderNo }),
            });
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setStatusText('交易上链成功！');
            await fetchWithPiAuth('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid }),
            });
            window.location.href = '/dashboard?success=true';
          },
          onCancel: () => {
            setLoading(false);
            setStatusText('');
            setErrorStatus('已取消支付。');
          },
          onError: (error: Error) => {
            setLoading(false);
            setStatusText('');
            setErrorStatus(`支付异常: ${error?.message || '未知错误'}`);
          },
        }
      );
    } catch (err: any) {
      setLoading(false);
      setErrorStatus(`操作失败: ${err?.message || '请重试'}`);
    }
  };

  return (
    <div className="max-w-md w-full bg-brand-dark-surface border border-brand-border rounded-card p-8 shadow-card relative">
      <Link
        href="/"
        className="absolute top-6 left-6 text-gray-400 hover:text-white text-sm flex items-center font-bold transition-colors"
      >
        ← 返回
      </Link>

      <h1 className="text-2xl font-black text-center mt-6 text-white mb-2">安全收银台</h1>
      <p className="text-sm text-center text-gray-400 mb-8 border-b border-brand-border pb-6">
        选择方案并确认支付
      </p>

      <div className="bg-brand-dark-elevated rounded-card p-6 mb-8 border border-brand-purple/20">
        <h2 className="text-sm font-semibold text-gray-400 mb-2">订阅方案</h2>
        <p className="text-lg font-black text-brand-gold mb-4">{selectedPlan.name}</p>

        {isCustom ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 mb-2">自定义金额 (π)</h2>
            <input
              type="number"
              min={1}
              step={0.01}
              value={customAmount || ''}
              onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
              placeholder="输入 π 数量"
              className="w-full bg-brand-dark border border-brand-border rounded-btn px-4 py-3 text-white text-2xl font-black focus:outline-none focus:border-brand-gold transition-colors"
            />
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 mb-2">金额</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-brand-gold text-4xl font-black">π</span>
              <span className="text-4xl font-black text-white">{selectedPlan.amount}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">有效期：{selectedPlan.duration}（仅框架订阅，不含商品上架）</p>
          </div>
        )}
      </div>

      {errorStatus && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm font-medium">
          {errorStatus}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-dark font-black text-lg py-4 rounded-btn shadow-glow-gold transition-all disabled:opacity-50 mb-4 flex justify-center items-center"
      >
        {loading ? (
          <span className="animate-pulse text-sm">{statusText}</span>
        ) : (
          <span className="flex items-center gap-2">
            确认支付 <span className="text-xl font-black">→</span>
          </span>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        支付由 Pi Network 链上安全机制保护
      </p>
    </div>
  );
}

