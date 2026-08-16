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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="pi-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pi-violet text-xl">
            💬
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">AI 智能助手</h1>
            <p className="mt-0.5 text-sm text-pi-muted">
              面向商户运维、订单、会员与支付流程的智能建议
            </p>
          </div>
        </div>

        <textarea
          rows={5}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="输入你的业务问题…"
          className="w-full resize-none rounded-2xl border border-pi-line bg-white/[0.03] px-5 py-4 text-sm text-white outline-none transition-all placeholder:text-pi-muted/50 focus:border-pi-gold/50 focus:ring-2 focus:ring-pi-gold/20"
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-pi-muted">支持多模型 · 流式响应</span>
          <button type="button" onClick={handleSubmit} disabled={loading} className="pi-btn-gold">
            {loading ? 'AI 处理中…' : '生成建议 →'}
          </button>
        </div>
      </div>

      <div className="pi-card min-h-[220px] p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">输出结果</h2>
          {result && (
            <span className="pi-pill border-pi-gold/30 bg-pi-gold/10 text-pi-gold">✓ 已完成</span>
          )}
        </div>
        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : result ? (
          <div className="whitespace-pre-wrap text-sm leading-7 text-white/90">{result}</div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <span className="text-3xl">✨</span>
            <p className="mt-3 text-sm text-pi-muted">
              请提交问题，Pioneer AI 将为你生成可执行建议。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
