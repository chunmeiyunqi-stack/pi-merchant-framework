'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchWithPiAuth } from '@/lib/apiClient';

type PlanKey = 'basic' | 'pro';

type Plan = {
  name: string;
  amount: number;
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
  basic: { name: '基础建站先锋 (Basic Plan)', amount: 5.0 },
  pro: { name: '专业 AI 架构 (Pro Plan)', amount: 25.0 },
};

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = (searchParams?.get('plan') ?? 'basic') as PlanKey;

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('准备收银台...');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const selectedPlan = PLANS[plan] ?? PLANS.basic;

  const handlePayment = async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      setErrorStatus('⚠️ 侦测到您并未在 Pi Browser 内发起支付。');
      return;
    }

    setLoading(true);
    setStatusText('1. 正在服务器生成生态商户订单...');
    setErrorStatus(null);

    try {
      const orderRes = await fetchWithPiAuth('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedPlan.amount,
          planId: plan,
          memo: `Framework Subscription: ${selectedPlan.name}`,
        }),
      });

      const orderData = (await orderRes.json()) as OrderResponse;

      if (!orderData.success) {
        if (orderRes.status === 401) {
          setErrorStatus('身份未授权，请回首页通过 Pi Wallet 连接。');
        } else {
          setErrorStatus('服务器创建订单失败: ' + (orderData.error ?? '未知错误'));
        }
        setLoading(false);
        return;
      }

      setStatusText('2. 正在唤醒区块链底层安全验证...');
      const Pi = window.Pi;

      Pi.createPayment(
        {
          amount: selectedPlan.amount,
          memo: `Subscription: ${selectedPlan.name}`,
          metadata: { orderId: orderData.order.orderNo, planId: plan },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            setStatusText(`3. 服务器核算对价中 [${paymentId.slice(0, 6)}...]`);
            await fetchWithPiAuth('/api/payments/approve', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ paymentId, orderId: orderData.order.orderNo }),
            });
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setStatusText('4. 交易上链成功！正在为您颁发数字权益...');
            await fetchWithPiAuth('/api/payments/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ paymentId, txid }),
            });
            router.push('/dashboard?success=true');
          },
          onCancel: () => {
            setLoading(false);
            setStatusText('');
            setErrorStatus('💡 动作已中止，您取消了支付，未发生资产转移。');
          },
          onError: (error: Error) => {
            setLoading(false);
            setStatusText('');
            console.error('Payment API error', error);
            setErrorStatus(`⚠️ 支付唤起遭遇异常: ${error?.message || '未知错误'}`);
          },
        }
      );
    } catch (error: unknown) {
      console.error(error);
      setLoading(false);
      setErrorStatus(`本地逻辑发生异常: ${error instanceof Error ? error.message : '未知异常'}`);
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
        <p className="text-lg font-black text-brand-gold mb-6">{selectedPlan.name}</p>

        <h2 className="text-sm font-semibold text-gray-400 mb-2">金额</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-brand-gold text-4xl font-black">π</span>
          <span className="text-4xl font-black text-white">{selectedPlan.amount.toFixed(2)}</span>
        </div>
      </div>

      {errorStatus && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm font-medium">
          {errorStatus}
        </div>
      )}

      <button
        onClick={handlePayment}
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

