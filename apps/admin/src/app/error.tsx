'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-purple-600/20 rounded-full" />
          <h1 className="relative text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-700">
            500
          </h1>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-200">抱歉，系统出现了点状况</h2>
          <p className="text-neutral-400">
            我们在处理您的请求时遇到了意外错误。这可能是暂时的网络问题，或者是系统核心引擎正在升级。
          </p>
          {error.digest && (
            <p className="text-xs text-neutral-600 font-mono">错误追踪 ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-neutral-200 transition-all active:scale-95"
          >
            重试一次
          </button>
          <Link
            href="/"
            className="px-8 py-3 rounded-full border border-neutral-800 text-neutral-400 hover:bg-neutral-900 transition-all active:scale-95"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
