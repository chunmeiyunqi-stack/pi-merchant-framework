'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'basic';
  
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('准备收银台...');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const plans = {
    basic: { name: '基础建站先锋 (Basic Plan)', amount: 5.0 },
    pro: { name: '专业 AI 架构 (Pro Plan)', amount: 25.0 }
  };
  
  const selectedPlan = plans[plan as keyof typeof plans] || plans.basic;

  const handlePayment = async () => {
    if (typeof window === 'undefined' || !(window as any).Pi) {
      setErrorStatus("⚠️ 侦测到您并未在 Pi Browser 内发起支付。");
      return;
    }

    setLoading(true);
    setStatusText('1. 正在服务器生成生态商户订单...');
    setErrorStatus(null);

    try {
      // Step 1: Draft order creation (Idempotent keys generated server side for the user action)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           amount: selectedPlan.amount,
           planId: plan,
           memo: `Framework Subscription: ${selectedPlan.name}`
        })
      });

      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        if (orderRes.status === 401) {
            setErrorStatus("身份未授权，请回首页通过 Pi Wallet 连接。");
        } else {
            setErrorStatus("服务器创建订单失败: " + orderData.error);
        }
        setLoading(false);
        return;
      }

      setStatusText('2. 正在唤醒区块链底层安全验证...');
      const Pi = (window as any).Pi;
      
      // Step 2: Use Core Pi.createPayment API
      Pi.createPayment({
        amount: selectedPlan.amount,
        memo: `Subscription: ${selectedPlan.name}`,
        metadata: { orderId: orderData.order.orderNo, planId: plan },
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          setStatusText(`3. 服务器核算对价中 [${paymentId.slice(0,6)}...]`);
          await fetch('/api/payments/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, orderId: orderData.order.orderNo })
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          setStatusText('4. 交易上链成功！正在为您颁发数字权益...');
          await fetch('/api/payments/complete', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ paymentId, txid })
          });
          // All good, flow returning to dashboard
          router.push('/dashboard?success=true');
        },
        onCancel: (paymentId: string) => {
          setLoading(false);
          setStatusText('');
          setErrorStatus(`💡 动作已中止，您取消了支付，未发生资产转移。`);
        },
        onError: (error: any, payment: any) => {
          setLoading(false);
          setStatusText('');
          console.error("Payment API error", error);
          setErrorStatus(`⚠️ 支付唤起遭遇异常: ${error?.message || "未知错误"}`);
        }
      });
    } catch (e: any) {
      console.error(e);
      setLoading(false);
      setErrorStatus(`本地逻辑发生异常: ${e.message}`);
    }
  };

  return (
    <div className="max-w-md w-full bg-[#1E112A] border border-[#F3C136]/20 rounded-3xl p-8 shadow-2xl relative">
      {/* Back navigation */}
      <Link href="/" className="absolute top-6 left-6 text-gray-500 hover:text-gray-300 text-sm flex items-center font-bold">
        ← 返回大厅
      </Link>
      
      <h1 className="text-2xl font-black text-center mt-6 text-white mb-2">安全收银台</h1>
      <p className="text-sm text-center text-gray-400 mb-8 border-b border-gray-700 pb-6">
        正在为您接入生态安全扣款网关
      </p>

      <div className="bg-[#2A1642] rounded-2xl p-6 mb-8 border border-indigo-900/50">
        <h2 className="text-sm font-bold text-gray-400 mb-2">订阅包裹类型</h2>
        <p className="text-lg font-black text-[#F3C136] mb-6">{selectedPlan.name}</p>

        <h2 className="text-sm font-bold text-gray-400 mb-2">等价结算金额</h2>
        <div className="flex items-baseline space-x-2">
          <span className="text-[#F3C136] text-4xl font-black">π</span>
          <span className="text-4xl font-black text-white">{selectedPlan.amount.toFixed(2)}</span>
        </div>
      </div>

      {errorStatus && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm font-medium">
          {errorStatus}
        </div>
      )}

      <button 
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-[#F3C136] hover:bg-[#EEA834] text-[#1E112A] font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(243,193,54,0.3)] transition-all disabled:opacity-50 disabled:grayscale mb-4 flex justify-center items-center"
      >
        {loading ? (
           <span className="animate-pulse">{statusText}</span>
        ) : (
           <span className="flex items-center">
              安全确认并投递 <span className="text-xl ml-2 font-black leading-none">→</span>
           </span>
        )}
      </button>

      <p className="text-xs text-center text-gray-500 font-medium">
         本次操作受底层防重放机制与密文验证码保护，保障完全的生态交互体验。
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#110B19] text-gray-200 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-[#F3C136] font-bold">载入收银台中...</div>}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}

