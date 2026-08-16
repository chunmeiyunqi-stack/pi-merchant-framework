'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateWithPi } from '@pi-merchant/pi-sdk';
import { storePiAuthToken } from '@/lib/apiClient';

export default function PiLoginButton() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 验证后端 session 是否仍有效
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUsername(data.username);
      })
      .catch(console.error);
  }, []);

  const handleLogin = async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      setStatus('请在 Pi Browser 中打开此应用后操作。');
      return;
    }

    setStatus(null);
    setLoading(true);
    try {
      const authResult = await authenticateWithPi(
        process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001'
      );
      if (authResult.success && authResult.user) {
        if (authResult.token) {
          storePiAuthToken(authResult.token);
        }
        setUsername(authResult.user.username);
        router.push('/dashboard');
        return;
      }

      setStatus(authResult.error ?? '身份验证失败');
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : '握手中止，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGoDashboard = () => router.push('/dashboard');

  if (username) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-pi-gold/30 bg-pi-surface2 px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pi-violet text-sm font-bold text-white">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-bold text-white">{username}</p>
            <p className="text-[10px] text-pi-gold/80">Pi 已连接</p>
          </div>
        </div>
        <button onClick={handleGoDashboard} className="pi-btn-gold !px-4 !py-2 text-xs">
          进入控制台
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="pi-btn-gold group !rounded-xl !px-5 !py-2.5"
      >
        <span className="text-base leading-none">π</span>
        {loading ? '正在握手…' : '连接 Pi Wallet'}
      </button>
      {status && (
        <span className="mt-1.5 max-w-[260px] text-right text-[11px] font-medium text-amber-400/90">
          {status}
        </span>
      )}
      <span className="pointer-events-none mt-1 hidden text-[10px] text-pi-muted/60 sm:block">
        由官方安全验证通道提供支持
      </span>
    </div>
  );
}
