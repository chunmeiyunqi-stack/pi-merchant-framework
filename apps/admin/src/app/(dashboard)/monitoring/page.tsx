'use client';

// 授权监控与 Metrics

export default function MonitoringPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          授权管理与 Prometheus 监控
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          框架 License 状态以及 Prometheus / Grafana 指标暴露
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white mb-2">🛡️ 商业授权 Certificate</h2>
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-purple-300">先锋人工智能服务框架 V2.0.0 商业版</p>
            <p className="text-slate-400 text-[11px] mt-0.5">授信对象: 美丽时光工作室 · 永久授权</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            VALID (合规)
          </span>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white mb-2">📊 Prometheus 监控 Endpoint</h2>
        <p className="text-xs text-slate-400">
          后端 API 现已通过 <code>withMetrics</code> 中间件暴露出 Grafana 可拉取的指标端口：
        </p>
        <div className="p-3 rounded-xl bg-slate-800 font-mono text-xs text-amber-300">
          GET /api/metrics (Prometheus Format)
        </div>
      </div>
    </div>
  );
}
