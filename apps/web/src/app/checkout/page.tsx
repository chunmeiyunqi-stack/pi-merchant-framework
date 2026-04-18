'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId') || '1';

  const [status, setStatus] = useState<'idle' | 'create_order' | 'paying' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const executePayment = async () => {
    if (typeof window === 'undefined' || !(window as any).Pi) {
      setStatus('failed');
      setErrorMsg("未检测到 Pi 环境，请在 Pi Browser 内打开！");
      return;
    }

    try {
      setStatus('create_order');
      // 1. 创建本地订单
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001',
          customerId: 'mock-customer-id', // TODO: 应该从当前登录态获取
          serviceId: serviceId,
          amount: 12.0, // TODO: 需要根据服务实时获取
          note: 'From Web Checkout'
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const { orderNo, orderId, amount } = data;

      // 2. 调起 Pi 钱包进行交互式支付
      setStatus('paying');
      const Pi = (window as any).Pi;
      await Pi.createPayment(
        {
          amount: amount,
          memo: `Payment for Order ${orderNo}`,
          metadata: { orderId: orderId, orderNo: orderNo }
        }, 
        {
          onReadyForServerApproval: async (paymentId: string) => {
            const approveRes = await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, orderId })
            });
            if (!approveRes.ok) throw new Error("Approval fetch failed");
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            const compRes = await fetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid, orderId })
            });
            if (!compRes.ok) throw new Error("Completion fetch failed");
          },
          onCancel: async (paymentId: string) => {
            setStatus('idle');
            // 可以请求后端更新订单为取消
            fetch('/api/payments/cancel', {
              method: 'POST',
              body: JSON.stringify({ paymentId })
            }).catch(console.error);
          },
          onError: (error: Error, payment?: any) => {
            console.error('Payment SDK API Error', error);
            throw new Error(error.message || '支付异常终止');
          }
        }
      );

      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('failed');
      setErrorMsg(err.message || '支付处理中发生未知错误');
    }
  };

  if (status === 'success') {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-white flex flex-col items-center justify-center p-6 border-x border-gray-100">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">✓</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">支付完成</h1>
        <p className="text-gray-500 mb-10 text-center font-medium leading-relaxed">您的订单已在 Pi Network 链上确认。<br/>我们会第一时间为您安排服务！</p>
        <Link href="/" className="w-full text-center bg-[#7C3AED] text-white px-6 py-4 rounded-xl font-bold shadow-md hover:bg-[#6D28D9] transition-transform active:scale-95">返回首页面板</Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col border-x border-gray-100">
      <header className="p-4 bg-white border-b border-gray-100 flex items-center">
        <Link href={`/services/${serviceId}`} className="text-gray-500 hover:text-gray-800 font-medium flex items-center transition-colors">
          <span className="text-xl mr-1">←</span> 返回详情
        </Link>
      </header>

      <div className="p-6">
        <h1 className="text-2xl font-black text-gray-800 mb-6">安全收银台</h1>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
          <h2 className="text-gray-500 text-sm font-bold mb-2 uppercase tracking-wider relative z-10">订单待付总额</h2>
          <p className="text-5xl font-black text-[#7C3AED] relative z-10">π 12.00</p>
        </div>

        {status === 'failed' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 font-medium">
            <span className="font-bold">❌ 支付失败：</span>{errorMsg}
          </div>
        )}
      </div>

      <div className="mt-auto p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <p className="text-xs text-center text-gray-400 mb-4">通过官方 Pi SDK 接口进行签名与验证，商户无法获取您的密钥</p>
        <button 
          onClick={executePayment}
          disabled={status === 'create_order' || status === 'paying'}
          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300 disabled:shadow-none text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center space-x-2"
        >
          {status === 'create_order' ? (
            <>
              <span className="animate-spin text-xl leading-none">⟳</span>
              <span>正在向商户创建订单...</span>
            </>
          ) : status === 'paying' ? (
            <>
              <span className="animate-spin text-xl leading-none">⟳</span>
              <span>请在 Pi 钱包中确认...</span>
            </>
          ) : (
            <span>🚀 使用 Pi 钱包支付</span>
          )}
        </button>
      </div>
    </main>
  );
}

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-50 text-[#7C3AED] font-medium">准备收银台...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
