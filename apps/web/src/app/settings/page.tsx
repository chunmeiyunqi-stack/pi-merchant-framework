'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; username?: string }) => {
        setAuthenticated(!!data.authenticated);
        setUsername(data.username ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin" />
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500 mb-6">请先登录后再访问账户设置</p>
        <Link
          href="/login?returnUrl=/settings"
          className="bg-[#7C3AED] text-white px-6 py-3 rounded-xl font-medium"
        >
          前往登录
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-800 text-sm">
            ← 返回控制台
          </Link>
          <h1 className="text-lg font-bold text-gray-800">账户设置</h1>
          <span className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4 mt-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">Pi 账户信息</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">用户名</label>
              <p className="text-gray-800 font-medium">{username ?? '—'}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">认证方式</label>
              <p className="text-gray-800 font-medium">Pi Network OAuth</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">快捷入口</h2>
          <div className="space-y-2">
            <Link
              href="/history"
              className="block px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 transition-colors"
            >
              AI 生成历史 →
            </Link>
            <Link
              href="/dashboard/credentials"
              className="block px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 transition-colors"
            >
              API 凭证管理 →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
