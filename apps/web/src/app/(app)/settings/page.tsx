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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-pi-gold/20 border-t-pi-gold" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-pi-line bg-pi-surface p-10 text-center">
        <p className="text-pi-muted">请先登录后再访问账户设置</p>
        <Link href="/login?returnUrl=/settings" className="pi-btn-gold mt-6">
          前往登录
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">账户设置</h2>
        <p className="mt-1 text-sm text-pi-muted">管理您的 Pi 身份与账户偏好</p>
      </div>

      {/* Pi 账户信息 */}
      <section className="pi-card overflow-hidden">
        <div className="border-b border-pi-line px-6 py-4">
          <h3 className="text-sm font-bold text-white">Pi 账户信息</h3>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
            <span className="text-xs text-pi-muted">用户名</span>
            <span className="font-semibold text-white">{username ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
            <span className="text-xs text-pi-muted">认证方式</span>
            <span className="font-semibold text-white">Pi Network OAuth</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
            <span className="text-xs text-pi-muted">账户状态</span>
            <span className="pi-pill border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              ● 已连接
            </span>
          </div>
        </div>
      </section>

      {/* 快捷入口 */}
      <section className="pi-card overflow-hidden">
        <div className="border-b border-pi-line px-6 py-4">
          <h3 className="text-sm font-bold text-white">快捷入口</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {[
            { label: 'AI 生成历史', href: '/history', icon: '🕘' },
            { label: 'API 凭证管理', href: '/dashboard/credentials', icon: '🔑' },
            { label: '服务商城', href: '/services', icon: '🛍️' },
            { label: '质量分析', href: '/quality', icon: '📈' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 rounded-xl border border-pi-line bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition-all hover:border-pi-gold/30 hover:bg-white/[0.06]"
            >
              <span className="text-lg">{l.icon}</span>
              {l.label}
              <span className="ml-auto text-pi-muted">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
