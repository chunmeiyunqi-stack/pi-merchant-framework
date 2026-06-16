'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const stats = [
    { label: '今日流水', value: 'π 1,284.50', trend: '+12.5%', color: 'text-amber-500' },
    { label: '新增商户', value: '12', trend: '+3', color: 'text-indigo-600' },
    { label: 'AI 指令调用', value: '8,902', trend: '+24%', color: 'text-purple-600' },
    { label: '活跃用户 (24h)', value: '456', trend: '+5.2%', color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">业务实时监控大盘</h1>
        <p className="text-gray-500 mt-1 font-medium">先锋人工智能服务框架核心数据中枢</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {s.label}
            </p>
            <div className="flex items-end justify-between">
              <h2 className={`text-2xl font-black ${s.color}`}>{s.value}</h2>
              <span className="text-[10px] bg-gray-50 px-2 py-1 rounded-full font-bold text-gray-400">
                {s.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-gray-800">生态交易趋势 (7d)</h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-amber-400 rounded-full" />
              <span className="w-3 h-3 bg-indigo-400 rounded-full" />
            </div>
          </div>
          <div className="h-64 w-full flex items-end gap-2 px-4">
            {[40, 65, 45, 90, 75, 55, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-gradient-to-t from-amber-100 to-amber-500 rounded-t-xl transition-all group-hover:brightness-110"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-gray-400 font-bold">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">AI 提供商市场占有率</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-40 h-40 rounded-full border-[15px] border-indigo-600 border-t-amber-400 border-r-purple-500 border-l-emerald-400 rotate-45" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-gray-800">4</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Active Nodes</span>
            </div>
          </div>
          <div className="space-y-3 mt-6">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-2 h-2 bg-amber-400 rounded-full" /> OpenAI
              </span>
              <span className="font-bold">45%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-2 h-2 bg-indigo-600 rounded-full" /> Anthropic
              </span>
              <span className="font-bold">30%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-2 h-2 bg-purple-500 rounded-full" /> Ollama
              </span>
              <span className="font-bold">25%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
