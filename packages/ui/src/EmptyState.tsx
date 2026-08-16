import React from 'react';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="col-span-full p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3">
      <div className="text-4xl animate-bounce">{icon}</div>
      <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-sm">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
