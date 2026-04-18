'use client';

// 商户前台 — 支付结果页

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const isSuccess = status === 'success';

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl
          ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
          {isSuccess ? '✅' : '❌'}
        </div>

        <h1 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
          {isSuccess ? '支付成功！' : '支付失败'}
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {isSuccess
            ? '您的订单已确认，感谢您的支持！'
            : '支付未完成，请重新尝试或联系商家。'}
        </p>

        {orderId && (
          <p className="text-xs text-gray-300 mb-6">订单 ID：{orderId}</p>
        )}

        <div className="space-y-3">
          {isSuccess ? (
            <>
              <Link href="/orders">
                <button className="w-full bg-[#7C3AED] text-white font-semibold py-3 rounded-xl hover:bg-[#6D28D9] transition-colors">
                  查看我的订单
                </button>
              </Link>
              <Link href="/">
                <button className="w-full text-gray-500 py-3 rounded-xl border hover:bg-gray-50 transition-colors">
                  返回首页
                </button>
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => window.history.back()}
                className="w-full bg-[#7C3AED] text-white font-semibold py-3 rounded-xl hover:bg-[#6D28D9] transition-colors"
              >
                重新支付
              </button>
              <Link href="/">
                <button className="w-full text-gray-500 py-3 rounded-xl border hover:bg-gray-50 transition-colors">
                  返回首页
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-4xl">⟳</div></div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
