'use client';

// ============================================================
// 商户前台 — 登录页
// 通过 Pi Network 认证登录，成功后跳转商户首页
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateWithPi } from '@pi-merchant/pi-sdk';

const DEFAULT_MERCHANT_ID = process.env.NEXT_PUBLIC_DEFAULT_MERCHANT_ID ?? '';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePiLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await authenticateWithPi(DEFAULT_MERCHANT_ID);
      if (result.success && result.user) {
        router.push('/');
      } else {
        setError(result.error ?? '登录失败，请重试');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录异常，请在 Pi Browser 中打开');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">π</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign In</h1>
        <p className="text-gray-500 text-sm mb-8">
          登录您的账户以继续访问
        </p>

        {/* Pi 登录按钮 */}
        <button
          onClick={handlePiLogin}
          disabled={loading}
          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300 
                     text-white font-semibold py-3 px-6 rounded-xl transition-all 
                     duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin text-lg">⟳</span>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span className="text-xl">π</span>
              <span>Sign In with Pi</span>
            </>
          )}
        </button>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          请在 Pi Browser 中打开以使用 Pi 登录功能
        </p>
      </div>
    </main>
  );
}
