'use client';

import { useState } from 'react';

export default function AiPage() {
  const [prompt, setPrompt] = useState('我想优化前端商户支付体验，有什么建议？');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'AI 请求失败，请稍后重试。');
        return;
      }

      setResult(data.result);
    } catch (_err) {
      setError('无法连接 AI 服务，请检查网络或稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/20">
          <h1 className="text-3xl font-bold text-white mb-3">AI 智能助手</h1>
          <p className="text-sm text-slate-400 mb-6">
            发送业务问题给 Pioneer AI，获取面向商户运维、订单、会员和支付流程的建议。
          </p>

          <textarea
            rows={5}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="w-full resize-none rounded-3xl border border-slate-800 bg-slate-950 px-5 py-4 text-sm text-slate-100 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'AI 处理中…' : '生成建议'}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/20 min-h-[220px]">
          <h2 className="text-xl font-semibold text-white mb-4">输出结果</h2>
          {error ? (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : result ? (
            <div className="whitespace-pre-wrap text-sm leading-7 text-slate-100">{result}</div>
          ) : (
            <p className="text-sm text-slate-400">请提交问题，Pioneer AI 将为你生成可执行建议。</p>
          )}
        </div>
      </div>
    </main>
  );
}
