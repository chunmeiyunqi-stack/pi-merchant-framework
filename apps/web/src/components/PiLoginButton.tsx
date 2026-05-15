'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateWithPi } from '@pi-merchant/pi-sdk';

export default function PiLoginButton() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 验证后端 session 是否仍有效
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setUsername(data.username);
      })
      .catch(console.error);
  }, []);

  const handleLogin = async () => {
    // Pi Browser 同步加载 SDK，Pi.init() 也是同步的，此处直接检查即可
    if (typeof window === 'undefined' || !(window as any).Pi) {
      alert('💡 请在 Pi Browser 中打开此应用后再操作。');
      return;
    }

    setLoading(true);
    try {
      const authResult = await authenticateWithPi(process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001');
      if (authResult.success && authResult.user) {
        if (authResult.token) {
          localStorage.setItem('pi_auth_token_fallback', authResult.token);
        }
        setUsername(authResult.user.username);
        router.push('/dashboard');
        return;
      }

      console.error('[PiLogin] 后端验证失败:', authResult.error);
      alert('身份验证失败: ' + (authResult.error ?? '未知错误'));
    } catch (error: any) {
      console.error('[PiLogin] 握手异常:', error);
      alert('握手中止，请重试。错误: ' + (error?.message ?? '未知'));
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
          className="bg-[#2A1642]/80 hover:bg-[#3B2D4F] text-[#F3C136] border border-[#F3C136]/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
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
        className="bg-transparent border border-[#F3C136]/60 hover:bg-[#F3C136] hover:text-[#1E112A] text-[#F3C136] px-4 py-2 rounded-xl shadow-lg transition-all text-sm font-bold disabled:opacity-50 flex items-center space-x-2"
      >
        <span>{loading ? '等待握手...' : '🔗 同步 Pi Wallet 身份'}</span>
      </button>
      <span className="text-[10px] text-gray-500 mt-1 pointer-events-none hidden sm:block">
        由官方安全验证通道提供支持
      </span>
    </div>
  );
}
