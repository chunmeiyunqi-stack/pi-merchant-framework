'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PiLoginButton() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // P1-A: Validate session with backend
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setUsername(data.username);
      })
      .catch(console.error);
  }, []);

  const handleLogin = async () => {
    if (typeof window === 'undefined' || !(window as any).Pi) {
      alert("💡 提示: 请复制链接并前往 Pi Browser 继续这步操作！");
      return;
    }

    setLoading(true);
    try {
      const Pi = (window as any).Pi;
      const authResult = await Pi.authenticate(['payments', 'username'], (payment: any) => {
         console.warn("发现未流转完毕的支付行为:", payment);
      });
      
      const res = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authResult.accessToken,
          piUid: authResult.user.uid,
          username: authResult.user.username,
          merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001'
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setUsername(authResult.user.username);
        // Successful HttpOnly cookie session generated, routing to dashboard
        router.push('/dashboard');
      } else {
        alert('身份授权接入遇到问题: ' + data.error);
      }
    } catch (error: any) {
      console.error('Auth Error', error);
      alert('生态身份唤起中止或发生异常，请重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleGoDashboard = () => {
    router.push('/dashboard');
  };

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
      <span className="text-[10px] text-gray-500 mt-1 pointer-events-none hidden sm:block">由官方安全验证通道提供支持</span>
    </div>
  );
}

