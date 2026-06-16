'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CheckoutPage() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const handlePay = () => {
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-8 h-8 rounded-lg bg-[#F3C136] flex items-center justify-center text-black font-black text-xs">
            PI
          </div>
          <h1 className="text-xl font-bold tracking-tight">先锋生态收银台</h1>
        </div>

        <div className="bg-[#150B20] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          {status === 'success' && (
            <div className="absolute inset-0 bg-[#05020A]/90 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                ✓
              </div>
              <h2 className="text-2xl font-bold mb-2">订单支付成功</h2>
              <p className="text-neutral-500 text-center mb-10">
                您的授权许可已即时生效，商户 ID: PI-892-XT。
              </p>
              <Link
                href="/dashboard"
                className="px-10 py-4 bg-[#F3C136] text-black font-bold rounded-2xl hover:bg-[#EEA834] transition-all active:scale-95"
              >
                进入管理后台
              </Link>
            </div>
          )}

          <div className="p-8 md:p-12 space-y-8">
            {/* Order Info */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">
                    Order Details
                  </p>
                  <h3 className="text-xl font-bold">先锋 AI 框架 - 专业架构版</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#F3C136]">π 25.00</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-500">账期有效期</span>
                  <span>12 个月 (年度授权)</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-500">包含组件</span>
                  <span>全量 AI 路由 + 支付 SDK</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                认证身份
              </h4>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600" />
                <div>
                  <p className="text-sm font-bold text-white">ExamplePioneer.pi</p>
                  <p className="text-[10px] text-neutral-500 font-mono">auth_key_v2_f892...</p>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePay}
              disabled={status !== 'idle'}
              className="w-full py-5 bg-[#F3C136] text-[#1E112A] font-black rounded-2xl text-lg hover:bg-[#EEA834] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-[#F3C136]/10 disabled:opacity-50"
            >
              {status === 'processing' ? (
                <>
                  <div className="w-5 h-5 border-4 border-[#1E112A]/20 border-t-[#1E112A] rounded-full animate-spin" />
                  处理中
                </>
              ) : (
                '使用 Pi Wallet 支付'
              )}
            </button>

            <p className="text-center text-[10px] text-neutral-600 font-medium">
              点击支付即代表您同意《先锋 AI 框架商业授权协议》
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
