'use client';

// 预约管理中心 — 日历 & 状态审核

import { useEffect, useState } from 'react';

interface Booking {
  id: string;
  slotStart: string;
  slotEnd: string;
  status: string;
  note?: string;
  createdAt: string;
  customer?: { username: string };
  service?: { title: string };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/admin/bookings', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">预约中心</h1>
          <p className="text-slate-400 text-xs mt-1">审核与履约顾客服务预约时间段</p>
        </div>
      </div>

      <div className="bg-slate-900/80 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
            <tr>
              {['顾客', '预约服务项目', '预约开始时间', '预约结束时间', '状态', '备注/请求'].map(
                (h) => (
                  <th key={h} className="px-5 py-4">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  <div className="flex justify-center items-center gap-2">
                    <span className="animate-spin text-lg">🌀</span>
                    <span>正在同步数据库预约列表...</span>
                  </div>
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500">
                  <div className="text-2xl mb-2">📅</div>
                  <span>暂无预约申请数据</span>
                </td>
              </tr>
            ) : (
              bookings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 text-purple-300 font-bold">
                    {item.customer?.username ?? '-'}
                  </td>
                  <td className="px-5 py-4 text-slate-200 font-semibold">
                    {item.service?.title ?? '-'}
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-mono">
                    {new Date(item.slotStart).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-5 py-4 text-slate-400 font-mono">
                    {new Date(item.slotEnd).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        item.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{item.note || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
