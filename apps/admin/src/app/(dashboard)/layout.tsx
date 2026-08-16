'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { label: '数据大盘', href: '/dashboard', icon: '📊' },
  { label: '订单中心', href: '/orders', icon: '📋' },
  { label: '预约管理', href: '/bookings', icon: '📅' },
  { label: '服务管理', href: '/services', icon: '🛍️' },
  { label: '支付流水', href: '/payments', icon: '💸' },
  { label: 'AI 中心', href: '/history', icon: '🤖' },
  { label: '会员体系', href: '/members', icon: '💳' },
  { label: '商户管理', href: '/merchants', icon: '🏢' },
  { label: '授权监控', href: '/monitoring', icon: '🛡️' },
  { label: '系统设置', href: '/settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 检查 Token 凭证
    const hasToken = document.cookie.includes('pi_auth_token');
    if (!hasToken) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = async () => {
    document.cookie = 'pi_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  // 生成面包屑路径
  const getBreadcrumbs = () => {
    const currentNav = navItems.find((n) => n.href === pathname);
    return [
      { label: '控制台', href: '/dashboard' },
      ...(currentNav && currentNav.href !== '/dashboard'
        ? [{ label: currentNav.label, href: currentNav.href }]
        : []),
    ];
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* 1. Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-slate-900/90 border-r border-slate-800 flex flex-col fixed inset-y-0 z-40 transition-all duration-300 backdrop-blur-xl`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-purple-600 to-indigo-600 p-[1px] shadow-lg shadow-purple-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center font-black text-amber-300 text-lg">
                π
              </div>
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                  先锋 AI 服务框架
                </h1>
                <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest">
                  Merchant V2.1
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs"
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* License Box */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-800">
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Pro License</span>
                <span className="text-[10px] text-slate-400">已授权</span>
              </div>
              <p className="text-xs font-bold text-white">商业专业版 Enterprise</p>
            </div>
          </div>
        )}
      </aside>

      {/* 2. Main Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}
      >
        {/* Top Header Bar */}
        <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-xl px-8 flex items-center justify-between">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs">
            {getBreadcrumbs().map((b, idx) => (
              <div key={b.href} className="flex items-center gap-2">
                {idx > 0 && <span className="text-slate-600">/</span>}
                <Link
                  href={b.href}
                  className={
                    idx === getBreadcrumbs().length - 1
                      ? 'text-purple-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }
                >
                  {b.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Header Right Quick User Menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>主网就绪</span>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md">
                  π
                </div>
                <span className="text-xs font-semibold text-slate-200">商户管理员</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-1 z-50 text-xs">
                  <div className="p-3 border-b border-slate-800">
                    <p className="font-bold text-white">Pi Network Merchant</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Role: Owner / Admin</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white"
                  >
                    ⚙️ 系统设置
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    🚪 退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View Body */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
