'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PiAuthResult {
  accessToken: string;
  user: { uid: string; username: string };
}

interface PiPayment {
  identifier: string;
  transaction?: { txid: string };
}

interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PiPayment) => void;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'auth' | 'processing' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [piUser, setPiUser] = useState<{ uid: string; username: string } | null>(null);
  const [isPiBrowser, setIsPiBrowser] = useState(false);

  useEffect(() => {
    setIsPiBrowser(typeof window !== 'undefined' && !!(window as any).Pi);
  }, []);

  const getPi = () =>
    (window as any).Pi as
      | {
          authenticate: (scopes: string[], cb: (p: PiPayment) => void) => Promise<PiAuthResult>;
          createPayment: (data: PiPaymentData, callbacks: PiPaymentCallbacks) => void;
        }
      | undefined;

  // 处理未完成的支付
  const handleIncompletePayment = async (payment: PiPayment) => {
    if (payment.transaction?.txid) {
      await fetch('/api/payments/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.identifier,
          txid: payment.transaction.txid,
        }),
      });
    }
  };

  const handleAuth = async () => {
    const Pi = getPi();
    if (!Pi) {
      setErrorMsg('请在 Pi Browser 中打开此页面');
      return;
    }
    setStatus('auth');
    try {
      const auth = await Pi.authenticate(['username', 'payments'], handleIncompletePayment);
      await fetch('/api/auth/pi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          piUid: auth.user.uid,
          username: auth.user.username,
        }),
      });
      setPiUser(auth.user);
      setStatus('idle');
    } catch (e) {
      setErrorMsg('身份验证失败，请重试');
      setStatus('failed');
    }
  };

  const handlePay = async () => {
    const Pi = getPi();
    if (!Pi) {
      setErrorMsg('请在 Pi Browser 中打开此页面');
      return;
    }
    if (!piUser) {
      await handleAuth();
      return;
    }
    setStatus('processing');
    setErrorMsg('');

    Pi.createPayment(
      {
        amount: 25,
        memo: '先锋 AI 框架 - 专业架构版 年度授权',
        metadata: { product: 'ai-framework-pro', duration: '12months' },
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          const res = await fetch('/api/payments/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId }),
          });
          if (!res.ok) {
            setErrorMsg('支付审批失败，请重试');
            setStatus('failed');
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          const res = await fetch('/api/payments/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid }),
          });
          if (res.ok) {
            router.push('/payment-result?status=success');
          } else {
            router.push('/payment-result?status=failed');
          }
        },
        onCancel: (_paymentId: string) => {
          router.push('/payment-result?status=cancelled');
        },
        onError: (error: Error) => {
          console.error('Pi payment error:', error);
          setErrorMsg('支付出错：' + error.message);
          setStatus('failed');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-8 h-8 rounded-lg bg-[#F3C136] flex items-center justify-center text-black font-black text-xs">
            PI
          </div>
          <h1 className="text-xl font-bold tracking-tight">先锋生态收银台</h1>
        </div>

        <div className="bg-[#150B20] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          <div className="p-8 md:p-12 space-y-8">
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

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                认证身份
              </h4>
              {piUser ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600" />
                  <div>
                    <p className="text-sm font-bold text-white">{piUser.username}</p>
                    <p className="text-[10px] text-green-400 font-mono">✓ 已通过 Pi 身份验证</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-neutral-800" />
                  <div>
                    <p className="text-sm text-neutral-400">
                      {isPiBrowser ? '点击下方按钮进行 Pi 身份验证' : '请在 Pi Browser 中打开'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {errorMsg}
              </div>
            )}

            {!isPiBrowser ? (
              <div className="w-full py-5 bg-neutral-800 text-neutral-400 font-bold rounded-2xl text-center">
                请在 Pi Browser 中打开以使用支付功能
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={status === 'processing' || status === 'auth'}
                className="w-full py-5 bg-[#F3C136] text-[#1E112A] font-black rounded-2xl text-lg hover:bg-[#EEA834] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-[#F3C136]/10 disabled:opacity-50"
              >
                {status === 'processing' || status === 'auth' ? (
                  <>
                    <div className="w-5 h-5 border-4 border-[#1E112A]/20 border-t-[#1E112A] rounded-full animate-spin" />
                    {status === 'auth' ? '验证身份中...' : '处理支付中...'}
                  </>
                ) : piUser ? (
                  '使用 Pi Wallet 支付'
                ) : (
                  '验证 Pi 身份并支付'
                )}
              </button>
            )}

            <p className="text-center text-[10px] text-neutral-600 font-medium">
              点击支付即代表您同意《先锋 AI 框架商业授权协议》
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
