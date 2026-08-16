import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface HeaderProps {
  breadcrumbs: BreadcrumbItem[];
  userMenuOpen: boolean;
  onToggleUserMenu: () => void;
  onLogout: () => void;
  onNavigate: (href: string) => void;
  username?: string;
  userRole?: string;
}

export function Header({
  breadcrumbs,
  userMenuOpen,
  onToggleUserMenu,
  onLogout,
  onNavigate,
  username = '商户管理员',
  userRole = 'Owner / Admin',
}: HeaderProps) {
  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-xl px-8 flex items-center justify-between">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        {breadcrumbs.map((b, idx) => (
          <div key={b.href} className="flex items-center gap-2">
            {idx > 0 && <span className="text-slate-600">/</span>}
            <button
              onClick={() => onNavigate(b.href)}
              className={
                idx === breadcrumbs.length - 1
                  ? 'text-purple-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }
            >
              {b.label}
            </button>
          </div>
        ))}
      </div>

      {/* Header Right */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>主网就绪</span>
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={onToggleUserMenu}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md">
              π
            </div>
            <span className="text-xs font-semibold text-slate-200">{username}</span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-1 z-50 text-xs">
              <div className="p-3 border-b border-slate-800">
                <p className="font-bold text-white">Pi Network Merchant</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Role: {userRole}</p>
              </div>
              <button
                onClick={() => onNavigate('/settings')}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                ⚙️ 系统设置
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-semibold"
              >
                🚪 退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
