'use client';

import Link from 'next/link';

export default function ImageGenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#0A0510] text-gray-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
          🎨
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">图像生成页面出错</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {error.message || '发生了意外错误，请刷新页面后重试。'}
          </p>
          {error.digest && (
            <p className="text-gray-600 text-xs mt-2 font-mono">错误码: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-[#F3C136] text-[#1E112A] font-semibold text-sm hover:bg-[#EEA834] transition-colors"
          >
            重试
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            返回控制台
          </Link>
        </div>
      </div>
    </main>
  );
}
