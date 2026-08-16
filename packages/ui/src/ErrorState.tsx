import React from 'react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  traceId?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = '数据加载失败',
  message = '网络开小差了或服务端出现异常，请稍后重试。',
  traceId,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="col-span-full p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl font-bold">
        ⚠️
      </div>
      <div>
        <h3 className="text-base font-bold text-rose-200">{title}</h3>
        <p className="text-xs text-rose-300/70 mt-1 max-w-md">{message}</p>
        {traceId && (
          <p className="text-[10px] font-mono text-rose-400/50 mt-1.5">Trace ID: {traceId}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-rose-600/20 flex items-center gap-1.5"
        >
          <span>🔄</span>
          <span>重新加载</span>
        </button>
      )}
    </div>
  );
}
