'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateWithPi } from '@pi-merchant/pi-sdk';
import { storePiAuthToken } from '@/lib/apiClient';

export default function PiLoginButton() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    // Pi Browser 同步加载 SDK，Pi.init() 也是同步的，此处直接检查即可
    if (typeof window === 'undefined' || !window.Pi) {
      alert('💡 请在 Pi Browser 中打开此应用后再操作。');
      return;
    }

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
        // 将 token 通过 URL 参数传递，确保 Pi Browser 中 dashboard 能收到身份凭证
        // HttpOnly cookie 在客户端导航中可能不会被发送
        const tokenParam = authResult.token ? `?token=${encodeURIComponent(authResult.token)}` : '';
        window.location.href = `/dashboard${tokenParam}`;
        return;
      }

      console.error('[PiLogin] 后端验证失败:', authResult.error);
      alert('身份验证失败: ' + (authResult.error ?? '未知错误'));
    } catch (error: unknown) {
      console.error('[PiLogin] 握手异常:', error);
      const errorMessage = error instanceof Error ? error.message : '未知';
      alert('握手中止，请重试。错误: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoDashboard = () => router.push('/dashboard');

  if (username) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm font-semibold text-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#3B2D4F] flex items-center justify-center text-[#F3C136] font-bold shadow-sm border border-[#F3C136]/30">
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline-block">{username}</span>
        </div>
        <button
          onClick={handleGoDashboard}
          className="bg-brand-dark-surface hover:bg-brand-dark-elevated text-brand-gold border border-brand-gold/30 px-3 py-1.5 rounded-btn text-xs font-bold transition-colors"
        >
          控制台
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-transparent border border-brand-gold/50 hover:bg-brand-gold hover:text-brand-dark text-brand-gold px-5 py-2.5 rounded-btn shadow-lg transition-all text-sm font-bold disabled:opacity-50 flex items-center gap-2"
      >
        <span>{loading ? '验证中...' : 'Pi Wallet 登录'}</span>
      </button>
      <span className="text-[10px] text-gray-500 mt-1 hidden sm:block">
        Pi Network 官方安全通道
      </span>
    </div>
  );
}
