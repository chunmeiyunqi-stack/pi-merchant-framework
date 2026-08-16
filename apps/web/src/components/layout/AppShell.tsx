'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// ──────────────────────────────────────────
// 导航配置（统一菜单，大厂级分组）
// ──────────────────────────────────────────
type NavEntry = {
  label: string;
  href: string;
  icon: string;
  match?: string[];
};

type NavSection = { title: string; items: NavEntry[] };

const NAV_SECTIONS: NavSection[] = [
  {
    title: '工作台',
    items: [
      { label: '概览', href: '/dashboard', icon: 'overview', match: ['/dashboard'] },
      { label: 'AI 智能助手', href: '/ai', icon: 'chat' },
      { label: '图像生成', href: '/image-gen', icon: 'image' },
      { label: '历史记录', href: '/history', icon: 'history' },
    ],
  },
  {
    title: '生态服务',
    items: [
      { label: '服务商城', href: '/services', icon: 'store' },
      { label: '质量分析', href: '/quality', icon: 'quality' },
    ],
  },
  {
    title: '开发者',
    items: [
      { label: 'API 文档', href: '/docs', icon: 'docs' },
      { label: '账户设置', href: '/settings', icon: 'settings' },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '概览',
  '/dashboard/configuration': '组件配置',
  '/dashboard/credentials': '业务凭证',
  '/dashboard/support': '架构支持',
  '/ai': 'AI 智能助手',
  '/image-gen': '图像生成',
  '/history': '历史记录',
  '/services': '服务商城',
  '/quality': '质量分析',
  '/docs': 'API 文档',
  '/settings': '账户设置',
};

function Icon({ name, className }: { name: string; className?: string }) {
  const cls = className ?? 'h-[18px] w-[18px]';
  const common = {
    className: cls,
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'overview':
      return (
        <svg {...common}>
          <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 01-8 8H4l2.5-2.5A8 8 0 1121 12z" />
        </svg>
      );
    case 'image':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'history':
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.5 2.7L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'store':
      return (
        <svg {...common}>
          <path d="M4 9l1-4h14l1 4M4 9v9a1 1 0 001 1h14a1 1 0 001-1V9M4 9h16M9 20v-6h6v6" />
        </svg>
      );
    case 'quality':
      return (
        <svg {...common}>
          <path d="M3 17l5-5 4 4 8-8" />
          <path d="M15 8h5v5" />
        </svg>
      );
    case 'docs':
      return (
        <svg {...common}>
          <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
          <path d="M14 3v6h6M8 13h8M8 17h5" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
    default:
      return <span className={cls} />;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [piReady, setPiReady] = useState<boolean | null>(null);

  // 拉取会话与 Pi 环境状态
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d: { authenticated?: boolean; username?: string }) => {
        if (d.authenticated) setUsername(d.username ?? '商户');
      })
      .catch(() => {});
    // Pi Browser 探测
    const t = setTimeout(() => setPiReady(typeof window !== 'undefined' && !!window.Pi), 600);
    return () => clearTimeout(t);
  }, []);

  const isActive = useCallback(
    (item: NavEntry) => {
      if (item.match) return item.match.some((m) => pathname.startsWith(m));
      return pathname === item.href;
    },
    [pathname]
  );

  const title = useMemo(() => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    const dash = Object.keys(PAGE_TITLES).find((k) => k !== '/dashboard' && pathname.startsWith(k));
    return dash ? PAGE_TITLES[dash] : '控制台';
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-pi-bg text-white flex">
      {/* ── 侧边导航 ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-pi-line bg-pi-bg/90 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? 'w-[76px]' : 'w-[264px]'
        }`}
      >
        {/* 品牌区 */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-pi-line">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-pi-brand p-[1.5px] shadow-pi-glow">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-pi-bg text-lg font-black text-pi-gold">
                π
              </div>
            </div>
            {!collapsed && (
              <div className="truncate leading-tight">
                <p className="text-sm font-bold tracking-tight text-white">Pioneer AI</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-pi-gold/70">
                  Merchant Suite
                </p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label="折叠导航"
            className="hidden rounded-lg p-1.5 text-pi-muted transition-colors hover:bg-white/5 hover:text-white sm:block"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" />
              )}
            </svg>
          </button>
        </div>

        {/* 导航 */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-pi-muted/60">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-pi-violet/15 text-white'
                          : 'text-pi-muted hover:bg-white/5 hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-pi-gold shadow-pi-glow" />
                      )}
                      <Icon name={item.icon} className={active ? 'text-pi-gold' : 'text-current'} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* 授权卡片 */}
        {!collapsed && (
          <div className="p-4">
            <div className="rounded-2xl border border-pi-gold/20 bg-gradient-to-b from-pi-surface2 to-pi-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pi-gold">
                  Pro
                </span>
                <span className="text-[10px] text-emerald-400">● 已授权</span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-white">商业专业版 Enterprise</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-pi-muted">
                全量 AI 组件 · 链上支付 · 多租户
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* ── 主内容 ── */}
      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${collapsed ? 'pl-[76px]' : 'pl-[264px]'}`}
      >
        {/* 顶栏 */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-pi-line bg-pi-bg/70 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white sm:text-lg">{title}</h1>
            <span className="hidden text-xs text-pi-muted sm:inline">/ Pi Merchant Framework</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Pi 状态胶囊 */}
            <div
              className={`pi-pill ${
                piReady === null
                  ? 'border-white/10 text-pi-muted'
                  : piReady
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${piReady ? 'bg-emerald-400 animate-pi-pulse' : 'bg-amber-400'} `}
              />
              {piReady === null ? '检测中' : piReady ? 'Pi 已连接' : '沙盒模式'}
            </div>

            {/* 返回首页 */}
            <Link href="/" className="pi-btn-text hidden md:inline-flex">
              <Icon name="home" className="h-4 w-4" />
              首页
            </Link>

            {/* 用户菜单 */}
            <div className="relative">
              <button
                onClick={() => setUserOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-white/5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pi-violet text-sm font-black text-white shadow-md">
                  {(username ?? 'π').charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-xs font-semibold text-white sm:inline">
                  {username ?? '未登录'}
                </span>
                <svg
                  className="h-3.5 w-3.5 text-pi-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {userOpen && (
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-pi-line bg-pi-surface2 p-1 shadow-pi-card">
                  <div className="border-b border-pi-line p-3">
                    <p className="text-sm font-bold text-white">Pi 商户账户</p>
                    <p className="mt-0.5 text-[10px] text-pi-muted">Role: Owner / Admin</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserOpen(false);
                      router.push('/settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-pi-muted hover:bg-white/5 hover:text-white"
                  >
                    ⚙️ 账户设置
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
                  >
                    🚪 退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
