'use client';

// AI 生成历史审计 — 连接 GenerationHistory 表

import { useEffect, useState } from 'react';

interface GenerationHistory {
  id: string;
  type: string;
  provider: string;
  model: string;
  prompt: string;
  status: string;
  totalTokens?: number;
  createdAt: string;
}

export default function HistoryPage() {
  const [histories, setHistories] = useState<GenerationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/v1/history?limit=10', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setHistories(data.data || data.histories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI 模型用量与历史审计</h1>
          <p className="text-slate-400 text-xs mt-1">
            追溯 OpenAI / Claude / StableDiffusion 模型生成记录
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
            <tr>
              {['模组类型', '提供商', '模型 ID', 'Prompt 提示词', 'Token 消耗', '状态', '时间'].map(
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
                <td colSpan={7} className="text-center py-12 text-slate-500">
                  <div className="flex justify-center items-center gap-2">
                    <span className="animate-spin text-lg">🌀</span>
                    <span>正在拉取 AI 生成记录...</span>
                  </div>
                </td>
              </tr>
            ) : histories.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-500">
                  <div className="text-2xl mb-2">🤖</div>
                  <span>暂无 AI 生成审计记录</span>
                </td>
              </tr>
            ) : (
              histories.map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                      {h.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-medium">{h.provider}</td>
                  <td className="px-5 py-4 font-mono text-purple-400 font-semibold">{h.model}</td>
                  <td className="px-5 py-4 text-slate-200 truncate max-w-[200px]">{h.prompt}</td>
                  <td className="px-5 py-4 font-mono text-amber-400">{h.totalTokens ?? '-'}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      {h.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-mono">
                    {new Date(h.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
