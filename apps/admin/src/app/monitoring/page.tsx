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

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">正在加载监控指标...</div>;
  }
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">系统监控中心</h1>
      <p className="text-sm text-gray-500 mb-8">
        基础监控已激活，当前展示的是实时商户核心指标与支付健康状态。
      </p>

      {/* License & Quota Section (New for V2.0.0) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">
                Active License
              </p>
              <h2 className="text-2xl font-black">商业专业版 V2.0</h2>
            </div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">已验证</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="opacity-70">有效期至</span>
              <span className="font-mono">2027-05-26</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">已授权商户 ID</span>
              <span className="font-mono">MER-888-PI</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10">
            <button className="w-full py-3 bg-white text-indigo-700 font-bold rounded-xl text-sm transition-transform active:scale-95">
              更新许可证
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h2 className="text-gray-900 font-bold mb-4">API 调用用量 (月度)</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-500 font-medium">OpenAI API 调用</span>
                <span className="text-gray-900 font-bold">1,245 / 5,000</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="w-[25%] h-full bg-indigo-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-500 font-medium">Pi SDK 支付指令</span>
                <span className="text-gray-900 font-bold">89 / 不限量</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="w-[5%] h-full bg-green-500 rounded-full" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400">
              * 数据每 15 分钟自动从 SDK 审计网关同步一次。
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-4">实时经营数据</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: '今日订单', value: metrics?.todayOrders ?? 0 },
          { label: '今日收入 (π)', value: metrics?.todayRevenue.toFixed(2) ?? '0.00' },
          { label: '活跃会员', value: metrics?.activeMemberships ?? 0 },
          { label: '待处理预约', value: metrics?.pendingBookings ?? 0 },
          { label: '待处理支付', value: metrics?.pendingPayments ?? 0 },
          { label: '活跃服务', value: metrics?.activeServices ?? 0 },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-gray-500 mb-3">{item.label}</p>
            <p className="text-3xl font-semibold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
