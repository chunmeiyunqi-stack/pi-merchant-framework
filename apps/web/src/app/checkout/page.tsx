'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface PiSDKLike {
  init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
  authenticate: (scopes: string[], cb: (p: PiPayment) => void) => Promise<PiAuthResult>;
  createPayment: (data: PiPaymentData, callbacks: PiPaymentCallbacks) => void;
}

/** 订阅方案表（首页定价卡跳转 ?plan=basic|pro，以 UI 展示为准：π50 / π90） */
const PLANS: Record<string, { title: string; amount: number; memo: string }> = {
  basic: {
    title: '基础建站先锋 (Basic Plan)',
    amount: 50,
    memo: '基础先锋 - 极速跑通支付账本与标准业务流',
  },
  pro: {
    title: '专业 AI 架构 (Pro Plan)',
    amount: 90,
    memo: '专业架构 - 全量高级 AI 组件与专属护航',
  },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = (searchParams?.get('plan') ?? 'pro') as string;
  const serviceId = searchParams?.get('serviceId') ?? '';

  const [status, setStatus] = useState<'idle' | 'auth' | 'processing' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [piUser, setPiUser] = useState<{ uid: string; username: string } | null>(null);
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const [product, setProduct] = useState<{ title: string; amount: number; memo: string }>(() => {
    const base = PLANS[planKey] ?? PLANS.pro;
    return { ...base };
  });
  const [productLoading, setProductLoading] = useState(!!serviceId);

  useEffect(() => {
    setIsPiBrowser(typeof window !== 'undefined' && !!window.Pi);
  }, []);

  // 若已有登录会话（例如首页已连接过 Pi），直接复用，避免在收银台二次认证
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.authenticated && data?.username) {
          setPiUser({ uid: '', username: data.username });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 如果从服务商城跳转（?serviceId=），拉取该服务并以其价格结算
  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    fetch(`/api/services/${serviceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.service) return;
        const s = data.service;
        setProduct({
          title: s.title,
          amount: Number(s.price) || 0,
          memo: `服务订阅 - ${s.title}`,
        });
      })
      .catch(() => {
        // 拉取失败时回退到默认方案
      })
      .finally(() => {
        if (!cancelled) setProductLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const getPi = useCallback((): PiSDKLike | undefined => {
    return (window as any).Pi as PiSDKLike | undefined;
  }, []);

  // 确保 Pi SDK 已初始化完成。
  // Pi.createPayment 内部走 checkInitialized()（未初始化会同步抛错，且不会等待 initPromise），
  // 而 Pi.authenticate 走 ensureInitialized()（会等待 init）。为避免在首次点击时
  // 出现 "SDK not initialized" 竞态，这里显式 await layout 内联脚本存下的 init Promise。
  const ensurePiInitialized = useCallback(async (Pi: PiSDKLike) => {
    const stored = (window as any).__piInitPromise as Promise<void> | undefined;
    if (stored && typeof stored.then === 'function') {
      await stored;
      return;
    }
    // 兜底：layout 内联脚本未执行（例如历史页面缓存）时，在此再初始化一次
    try {
      await Pi.init({
        version: '2.0',
        sandbox:
          process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false',
      });
    } catch {
      // 重复初始化在部分 SDK 版本会被忽略；失败不阻断后续流程
    }
  }, []);

  // 处理 Pi.authenticate 发现的上次未完成支付
  const handleIncompletePayment = useCallback(async (payment: PiPayment) => {
    if (payment.transaction?.txid) {
      await fetch('/api/payments/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.identifier,
          txid: payment.transaction.txid,
        }),
      }).catch(() => {});
    }
  }, []);

  // 身份握手：成功后返回用户信息（供后续直接进入支付环节）
  const handleAuth = useCallback(async (): Promise<{ uid: string; username: string } | null> => {
    const Pi = getPi();
    if (!Pi) {
      setErrorMsg('请在 Pi Browser 中打开此页面');
      return null;
    }
    setStatus('auth');
    setErrorMsg('');
    try {
      const auth = await Pi.authenticate(['username', 'payments'], handleIncompletePayment);
      const res = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          piUid: auth.user.uid,
          username: auth.user.username,
        }),
      });
      if (!res.ok) {
        let detail = '请重试';
        try {
          const errBody = await res.json();
          if (errBody?.error) detail = errBody.error;
        } catch {
          // 响应体不是 JSON 时忽略
        }
        setErrorMsg(`服务端身份校验失败：${detail}`);
        setStatus('failed');
        return null;
      }
      setPiUser(auth.user);
      setStatus('idle');
      return auth.user;
    } catch (e) {
      console.error('[Checkout] Pi 身份验证异常:', e);
      setErrorMsg('身份验证被取消或失败，请重试');
      setStatus('failed');
      return null;
    }
  }, [getPi, handleIncompletePayment]);

  // 仅重新建立支付授权（payments scope），不重复走 /api/auth/pi 服务端校验。
  // Pi Browser 对已授权过的 scope 会静默返回，不会再次弹窗。
  const ensurePaymentsScope = useCallback(
    async (Pi: PiSDKLike): Promise<boolean> => {
      try {
        await Pi.authenticate(['username', 'payments'], handleIncompletePayment);
        return true;
      } catch (e) {
        console.error('[Checkout] 支付授权失败:', e);
        return false;
      }
    },
    [handleIncompletePayment]
  );

  const handlePay = useCallback(async () => {
    const Pi = getPi();
    if (!Pi) {
      setErrorMsg('请在 Pi Browser 中打开此页面');
      return;
    }

    // 1. 尚未登录 → 完整握手（authenticate + 服务端校验）；已登录（首页已连接过）→ 只重建 payments scope
    if (!piUser) {
      const user = await handleAuth();
      if (!user) return;
    } else {
      const ok = await ensurePaymentsScope(Pi);
      if (!ok) {
        setErrorMsg('支付授权失败，请重试');
        setStatus('failed');
        return;
      }
    }

    setStatus('processing');
    setErrorMsg('');

    // 2. 确保 SDK 初始化完成（createPayment 依赖 initialized 状态，未初始化会同步抛错）
    try {
      await ensurePiInitialized(Pi);
    } catch {
      setErrorMsg('Pi SDK 初始化失败，请刷新页面后重试');
      setStatus('failed');
      return;
    }

    // 3. 客户端生成订单号：支付面板【不依赖】服务端订单创建结果，保证能正常唤起钱包
    const orderNo = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. 尽力创建服务端订单（后台异步，失败不阻断支付面板）
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: product.amount,
        memo: product.memo,
        planId: planKey,
        orderNo,
      }),
      credentials: 'include',
    }).catch(() => {
      console.warn('[Checkout] 服务端订单创建失败（不阻断支付）');
    });

    // 5. 立即唤起 Pi 原生支付确认（确认支付验证环节）
    try {
      Pi.createPayment(
        {
          amount: product.amount,
          memo: product.memo,
          metadata: {
            orderId: orderNo,
            planId: planKey,
            ...(serviceId ? { serviceId } : {}),
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              const res = await fetch('/api/payments/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, orderId: orderNo }),
                credentials: 'include',
              });
              if (!res.ok) {
                let detail = '';
                try {
                  const e = await res.json();
                  detail = e?.error ?? '';
                } catch {
                  // 忽略非 JSON 响应
                }
                console.error('[Checkout] 审批失败:', res.status, detail);
                setErrorMsg(`支付审批失败(${res.status})：${detail || '请检查 PI_API_KEY 等配置'}`);
              }
            } catch (e) {
              console.error('[Checkout] 审批异常:', e);
              setErrorMsg('支付审批请求失败，请重试');
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            try {
              const res = await fetch('/api/payments/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, txid }),
                credentials: 'include',
              });
              if (res.ok) {
                router.push(
                  `/payment-result?status=success&orderId=${encodeURIComponent(orderNo)}`
                );
              } else {
                router.push('/payment-result?status=failed');
              }
            } catch (e) {
              router.push('/payment-result?status=failed');
            }
          },
          onCancel: () => {
            router.push('/payment-result?status=cancelled');
          },
          onError: (error: Error) => {
            console.error('[Checkout] Pi 支付错误:', error);
            setErrorMsg('支付出错：' + error.message);
            setStatus('failed');
          },
        }
      );
    } catch (error) {
      // createPayment 同步抛错（如 SDK 未初始化、缺少 payments scope、金额非法等）
      // 不会走到 onError 回调，必须在此兜底，避免界面一直卡在 "处理支付中..."
      console.error('[Checkout] createPayment 同步异常:', error);
      setErrorMsg('支付唤起失败：' + (error instanceof Error ? error.message : '未知错误'));
      setStatus('failed');
    }
  }, [
    getPi,
    piUser,
    handleAuth,
    ensurePaymentsScope,
    product,
    planKey,
    serviceId,
    router,
    ensurePiInitialized,
  ]);

  return (
    <div className="min-h-screen bg-pi-bg text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pi-brand text-sm font-black text-[#1a0f2a] shadow-pi-glow">
            π
          </div>
          <h1 className="text-xl font-bold tracking-tight">先锋生态收银台</h1>
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-pi-line bg-pi-surface shadow-pi-card">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-pi-violet/15 blur-[100px]" />
          <div className="p-6 sm:p-8 md:p-12 space-y-8 relative">
            {/* 订单信息 */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-pi-muted">
                    Order Details
                  </p>
                  <h3 className="break-words text-xl font-bold leading-snug text-white">
                    {productLoading ? '加载服务中…' : product.title}
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-3xl font-black text-pi-gold">π {product.amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border border-pi-line bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3 text-xs font-medium">
                  <span className="shrink-0 text-pi-muted">结算方式</span>
                  <span className="text-right text-white">Pi 链上支付</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-xs font-medium">
                  <span className="shrink-0 text-pi-muted">安全保障</span>
                  <span className="text-right text-emerald-400">✓ 官方 SDK + 服务端审批</span>
                </div>
              </div>
            </div>

            {/* 认证身份 */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-pi-muted">
                认证身份
              </h4>
              {piUser ? (
                <div className="flex items-center gap-4 rounded-2xl border border-pi-line bg-white/[0.03] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pi-violet text-sm font-black text-white">
                    {piUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{piUser.username}</p>
                    <p className="text-[10px] font-mono text-emerald-400">
                      ✓ 已通过 Pi 身份验证，可直接支付
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl border border-pi-line bg-white/[0.03] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    ?
                  </div>
                  <div>
                    <p className="text-sm text-pi-muted">
                      {isPiBrowser ? '点击下方按钮进行 Pi 身份验证' : '请在 Pi Browser 中打开'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-pi-muted/60">
                      验证成功后自动进入支付确认环节
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="break-words rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm text-rose-300">
                {errorMsg}
              </div>
            )}

            {!isPiBrowser ? (
              <div className="w-full rounded-2xl bg-white/5 py-5 text-center font-bold text-pi-muted">
                请在 Pi Browser 中打开以使用支付功能
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={status === 'processing' || status === 'auth' || productLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-pi-brand py-5 text-lg font-black text-[#1a0f2a] shadow-pi-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {status === 'processing' || status === 'auth' ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-4 border-[#1a0f2a]/20 border-t-[#1a0f2a]" />
                    {status === 'auth' ? '验证身份中…' : '处理支付中…'}
                  </>
                ) : piUser ? (
                  '使用 Pi Wallet 确认支付'
                ) : (
                  '验证 Pi 身份并支付'
                )}
              </button>
            )}

            <p className="text-center text-[10px] font-medium text-pi-muted/60">
              点击支付即代表您同意《先锋 AI 框架商业授权协议》
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-pi-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pi-gold/20 border-t-pi-gold" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
