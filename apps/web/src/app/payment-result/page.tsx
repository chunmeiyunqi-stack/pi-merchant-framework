'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams?.get('status') ?? 'unknown';
  const orderId = searchParams?.get('orderId') ?? '';
  const isSuccess = status === 'success';

  return (
    <main className="min-h-screen bg-[#05020A] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 ${
            isSuccess
              ? 'bg-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]'
              : status === 'cancelled'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
          }`}
        >
          {isSuccess ? '✓' : status === 'cancelled' ? '—' : '✕'}
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {isSuccess ? '支付成功' : status === 'cancelled' ? '支付已取消' : '支付失败'}
        </h1>

        <p className="text-neutral-400 mb-2">
          {isSuccess
            ? '您的订单已确认，权益即将生效。'
            : status === 'cancelled'
              ? '您已取消本次支付，未发生资产转移。'
              : '支付过程中出现问题，请稍后重试或联系客服。'}
        </p>

        {orderId && <p className="text-neutral-500 text-sm font-mono mb-8">订单号：{orderId}</p>}

        <div className="flex flex-col gap-3">
          {isSuccess && (
            <Link
              href="/dashboard"
              className="block w-full py-4 bg-[#F3C136] text-[#1E112A] font-bold rounded-2xl hover:bg-[#EEA834] transition-all"
            >
              进入控制台
            </Link>
          )}
          <Link
            href={isSuccess ? '/services' : '/checkout'}
            className="block w-full py-4 bg-white/5 border border-white/10 text-white font-medium rounded-2xl hover:bg-white/10 transition-all"
          >
            {isSuccess ? '继续浏览服务' : '返回收银台'}
          </Link>
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#05020A] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#F3C136]/20 border-t-[#F3C136] rounded-full animate-spin" />
        </main>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
