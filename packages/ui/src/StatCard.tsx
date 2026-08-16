import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: string;
  trendPositive?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
}: StatCardProps) {
  return (
    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
          {title}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-base">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-black text-white tracking-tight font-mono">{value}</span>
        {trend && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-slate-500 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
}
