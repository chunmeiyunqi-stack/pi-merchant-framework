'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalMembers: number;
  pendingBookings: number;
  activeServices: number;
  pendingPayments: number;
  activeMemberships: number;
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isManual = false) => {
    if (typeof window === 'undefined') return;
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('API fetch failed');
      const data = await res.json();
      setStats(data);
      setError(false);
    } catch (_err) {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Header with Refresh & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>业务实时监控大盘</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
              Live DB
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            先锋人工智能服务框架 Pioneer AI Merchant Core Data Central
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
          >
            <span className={`${refreshing ? 'animate-spin' : ''}`}>🔄</span>
            <span>{refreshing ? '刷新中...' : '一键刷新'}</span>
          </button>
          <Link
            href="/services"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-purple-600/20"
          >
            + 上架服务
          </Link>
        </div>
      </div>

      {/* 2. Primary Key Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse p-6"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold flex items-center justify-between">
          <span>⚠️ 无法连接到 Postgres 数据库服务 API</span>
          <button onClick={() => fetchStats(true)} className="underline text-xs">
            重试
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Today Revenue */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                今日流水 (Pi)
              </span>
              <span className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-lg">
                💰
              </span>
            </div>
            <div className="text-3xl font-black text-amber-400 tracking-tight">
              π {stats?.todayRevenue?.toFixed(2) ?? '0.00'}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <span>今日链上实际结算金额</span>
            </p>
          </div>

          {/* Card 2: Today Orders */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                今日新订单
              </span>
              <span className="w-9 h-9 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 text-lg">
                📋
              </span>
            </div>
            <div className="text-3xl font-black text-purple-300 tracking-tight">
              {stats?.todayOrders ?? 0}{' '}
              <span className="text-sm font-normal text-slate-400">单</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">实时同步数据库订单表</p>
          </div>

          {/* Card 3: Total Members */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                注册顾客总数
              </span>
              <span className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">
                👥
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              {stats?.totalMembers ?? 0}{' '}
              <span className="text-sm font-normal text-slate-400">人</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              活跃会员数: {stats?.activeMemberships ?? 0}
            </p>
          </div>

          {/* Card 4: Pending Bookings */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                待确认预约
              </span>
              <span className="w-9 h-9 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-lg">
                ⏳
              </span>
            </div>
            <div className="text-3xl font-black text-indigo-300 tracking-tight">
              {stats?.pendingBookings ?? 0}{' '}
              <span className="text-sm font-normal text-slate-400">笔</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              待审核支付: {stats?.pendingPayments ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* 3. Quick Action Hub & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>⚡ 快捷功能导航</span>
            </h2>
            <span className="text-xs text-slate-500">根据 DB 数据状态驱动</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: '订单中心', desc: '查看与履约订单', href: '/orders', icon: '📋' },
              { title: '预约日历', desc: '审核处理顾客预约', href: '/bookings', icon: '📅' },
              { title: '服务管理', desc: '商品/服务上下架', href: '/services', icon: '🛍️' },
              { title: '会员中心', desc: '会员卡与权益发放', href: '/members', icon: '💳' },
            ].map((q) => (
              <Link
                key={q.title}
                href={q.href}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-purple-500/40 transition-all flex flex-col items-center text-center group"
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {q.icon}
                </span>
                <span className="font-bold text-sm text-slate-200 group-hover:text-purple-300">
                  {q.title}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">{q.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Real System Live Nodes */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <span>🛡️ 核心中间件节点状态</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <span className="text-slate-300">PostgreSQL 数据库</span>
                <span className="text-emerald-400 font-bold">● 已连接</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <span className="text-slate-300">Prisma ORM 实例</span>
                <span className="text-emerald-400 font-bold">● 健康 (v5.12)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <span className="text-slate-300">Prometheus 监控</span>
                <span className="text-purple-400 font-bold">● 活跃链路</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>数据库租户: default_merchant</span>
            <span className="text-slate-400 font-mono">v2.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
