'use client';

// ============================================================
// 商户前台 — 结账页（P0 核心页面）
// 下单确认 + 触发 Pi.createPayment() 完整支付流程
// ============================================================

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPayment } from '@pi-merchant/pi-sdk';

interface ServiceInfo {
  id: string;
  title: string;
  price: number;
  durationMinutes?: number;
  description?: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId');

  const [service, setService] = useState<ServiceInfo | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'creating_order' | 'waiting_payment' | 'success' | 'failed'
  >('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 加载服务详情
  useEffect(() => {
    if (!serviceId) return;
    fetch(`/api/services/${serviceId}`)
      .then((r) => r.json())
      .then((data: { service: ServiceInfo }) => setService(data.service))
      .catch(() => setErrorMsg('加载服务信息失败'));
  }, [serviceId]);

  // ── 核心：触发 Pi 支付 ─────────────────────────────────
  const handlePayWithPi = async () => {
    if (!service) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 步骤 1：创建本地订单
      setPaymentStatus('creating_order');
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: service.id, amount: service.price }),
        credentials: 'include',
      });

      if (!orderRes.ok) throw new Error('创建订单失败');
      const { order } = await orderRes.json() as { order: { id: string; orderNo: string } };
      setOrderId(order.id);

      // 步骤 2：触发 Pi 支付
      setPaymentStatus('waiting_payment');
      createPayment(
        {
          amount: service.price,
          memo: `购买服务：${service.title}`,
          metadata: { orderId: order.id, serviceId: service.id },
        },
        order.id,
        // 成功回调
        (paymentId, txid) => {
          console.log('[Checkout] 支付成功:', { paymentId, txid });
          setPaymentStatus('success');
          router.push(`/payment-result?status=success&orderId=${order.id}`);
        },
        // 失败回调
        (reason) => {
          console.warn('[Checkout] 支付失败:', reason);
          setPaymentStatus('failed');
          setErrorMsg(reason === 'Payment cancelled by user' ? '您已取消支付' : `支付失败：${reason}`);
          setLoading(false);
        }
      );
    } catch (err) {
      setPaymentStatus('failed');
      setErrorMsg(err instanceof Error ? err.message : '发起支付失败');
      setLoading(false);
    }
  };

  const statusLabels: Record<typeof paymentStatus, string> = {
    idle: '确认并支付',
    creating_order: '创建订单中...',
    waiting_payment: '请在 Pi 钱包中确认...',
    success: '支付成功！',
    failed: '重试支付',
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部导航 */}
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <h1 className="font-bold text-lg text-gray-800">确认订单</h1>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        {/* 服务信息卡片 */}
        {service ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 text-base mb-1">{service.title}</h2>
            {service.description && (
              <p className="text-gray-500 text-sm mb-3">{service.description}</p>
            )}
            {service.durationMinutes && (
              <p className="text-gray-400 text-xs mb-3">⏱ 时长：{service.durationMinutes} 分钟</p>
            )}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-gray-500 text-sm">服务价格</span>
              <span className="text-[#7C3AED] font-bold text-lg">
                π {service.price.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        )}

        {/* 支付方式 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">支付方式</h3>
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <span className="text-2xl">π</span>
            <div>
              <p className="font-medium text-gray-800 text-sm">Pi 支付</p>
              <p className="text-gray-400 text-xs">通过 Pi Network 安全支付</p>
            </div>
            <span className="ml-auto text-purple-600 text-sm font-medium">✓ 已选</span>
          </div>
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            {errorMsg}
          </div>
        )}

        {/* 等待支付提示 */}
        {paymentStatus === 'waiting_payment' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-purple-700 text-sm text-center">
            <div className="animate-spin text-2xl mb-2">⟳</div>
            <p>请在 Pi 钱包中确认支付</p>
            <p className="text-xs text-purple-400 mt-1">不要关闭此页面</p>
          </div>
        )}
      </div>

      {/* 底部支付按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm">应付金额</span>
            <span className="text-[#7C3AED] font-bold text-xl">
              π {service?.price.toFixed(2) ?? '--'}
            </span>
          </div>
          <button
            onClick={handlePayWithPi}
            disabled={loading || !service || paymentStatus === 'waiting_payment'}
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300
                       text-white font-bold py-4 rounded-2xl transition-all duration-200
                       flex items-center justify-center gap-2 text-base"
          >
            <span className="text-xl">π</span>
            <span>{statusLabels[paymentStatus]}</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl text-purple-600">⟳</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
