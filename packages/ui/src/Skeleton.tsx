import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = 'h-6 w-full' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-800/60 border border-slate-700/40 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
