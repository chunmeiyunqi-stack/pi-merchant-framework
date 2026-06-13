import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="relative inline-block">
          <div className="absolute inset-0 blur-2xl bg-amber-500/10 rounded-full" />
          <span className="relative text-8xl font-bold tracking-tighter text-neutral-800">
            404
          </span>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">页面未找到</h1>
          <p className="text-neutral-500 text-lg">
            您访问的页面不存在或已被移动到新的 AI 节点。
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all active:scale-95"
          >
            返回先锋控制台
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <h3 className="text-sm font-medium text-amber-500">寻找商户后台?</h3>
            <p className="text-xs text-neutral-500 mt-1">请通过 Pi 浏览器访问应用入口。</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <h3 className="text-sm font-medium text-amber-500">遇到技术问题?</h3>
            <p className="text-xs text-neutral-500 mt-1">请联系系统管理员秦晓望。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
