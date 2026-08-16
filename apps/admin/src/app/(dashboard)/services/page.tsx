'use client';

// 服务管理中心 — 服务/商品 CRUD 控制台

import { useEffect, useState } from 'react';

interface Service {
  id: string;
  title: string;
  description?: string;
  price: number;
  type: string;
  status: string;
  durationMinutes?: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/admin/services', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setServices(data.services || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">服务/商品管理</h1>
          <p className="text-slate-400 text-xs mt-1">配置上架供 Pi 支付调用的商品与项目</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:brightness-110 shadow-md shadow-purple-600/20">
          + 新增服务/商品
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse p-6"
            />
          ))
        ) : services.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
            暂无上架的服务项目
          </div>
        ) : (
          services.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                    {item.type}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">● 上架中</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {item.description || '无详细描述'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">标价 (Pi)</span>
                  <span className="text-xl font-black text-amber-400">
                    π {Number(item.price).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {item.durationMinutes ? `${item.durationMinutes} 分钟` : '-'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
