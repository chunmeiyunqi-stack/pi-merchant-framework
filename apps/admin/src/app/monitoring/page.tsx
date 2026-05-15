'use client';

import { useEffect, useState } from 'react';

interface MonitoringMetrics {
  todayOrders: number;
  todayRevenue: number;
  totalMembers: number;
  pendingBookings: number;
  activeServices: number;
  pendingPayments: number;
  activeMemberships: number;
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard/stats', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: MonitoringMetrics) => setMetrics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">系统监控中心</h1>
      <p className="text-sm text-gray-500 mb-8">基础监控已激活，当前展示的是实时商户核心指标与支付健康状态。</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: '今日订单', value: metrics?.todayOrders ?? 0 },
          { label: '今日收入 (π)', value: metrics?.todayRevenue.toFixed(2) ?? '0.00' },
          { label: '活跃会员', value: metrics?.activeMemberships ?? 0 },
          { label: '待处理预约', value: metrics?.pendingBookings ?? 0 },
          { label: '待处理支付', value: metrics?.pendingPayments ?? 0 },
          { label: '活跃服务', value: metrics?.activeServices ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-3">{item.label}</p>
            <p className="text-3xl font-semibold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
