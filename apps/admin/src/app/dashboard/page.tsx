'use client';

// ============================================================
// 商户后台 — 数据概览 Dashboard
// ============================================================

import { useEffect, useState } from 'react';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalMembers: number;
  pendingBookings: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: DashboardStats) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: '今日订单', value: stats?.todayOrders ?? 0, icon: '📋', color: 'bg-blue-50 border-blue-100' },
    { label: '今日收款 (π)', value: stats?.todayRevenue?.toFixed(2) ?? '0.00', icon: '💰', color: 'bg-green-50 border-green-100' },
    { label: '总会员数', value: stats?.totalMembers ?? 0, icon: '⭐', color: 'bg-purple-50 border-purple-100' },
    { label: '待核销预约', value: stats?.pendingBookings ?? 0, icon: '📅', color: 'bg-orange-50 border-orange-100' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">数据概览</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} border rounded-2xl p-5`}>
            <div className="text-3xl mb-3">{card.icon}</div>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? <span className="animate-pulse text-gray-300">--</span> : card.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
