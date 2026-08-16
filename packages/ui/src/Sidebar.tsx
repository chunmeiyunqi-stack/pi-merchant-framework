import React from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface SidebarProps {
  navItems: NavItem[];
  currentPath: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (href: string) => void;
  brandTitle?: string;
  brandSubtitle?: string;
}

export function Sidebar({
  navItems,
  currentPath,
  collapsed,
  onToggleCollapse,
  onNavigate,
  brandTitle = '先锋 AI 服务框架',
  brandSubtitle = 'Merchant V2.1',
}: SidebarProps) {
  return (
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
                {brandTitle}
              </h1>
              <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest">
                {brandSubtitle}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate text-left">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* License Footer Box */}
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
  );
}
