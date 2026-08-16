'use client';

// 商户/多租户与子账号管理中心

export default function MerchantsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">商户与多租户管理</h1>
          <p className="text-slate-400 text-xs mt-1">
            控制 Merchant 隔离配置、成员角色权限及域名映射
          </p>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center text-slate-950 font-black text-xl">
              美
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">美丽时光工作室 (Default Tenant)</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: cme_default_beauty_merchant_01
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            ● 正常激活
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <span className="text-slate-400 block mb-1">商户类型</span>
            <span className="font-bold text-slate-200 text-sm">BEAUTY (丽人美业)</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <span className="text-slate-400 block mb-1">结算币种</span>
            <span className="font-bold text-amber-400 text-sm">Pi Network (PI)</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <span className="text-slate-400 block mb-1">管理员子账号</span>
            <span className="font-bold text-purple-300 text-sm">3 个活跃用户</span>
          </div>
        </div>
      </div>
    </div>
  );
}
