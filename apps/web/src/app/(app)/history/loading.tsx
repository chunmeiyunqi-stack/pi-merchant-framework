// Server Component — Next.js App Router 自动在 Suspense 边界使用
export default function HistoryLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Title skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-7 w-40 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-white/5 rounded animate-pulse" />
      </div>
      {/* Tab skeleton */}
      <div className="flex space-x-2 mb-6">
        {[80, 64, 64, 64].map((w, i) => (
          <div key={i} className="h-9 bg-white/10 rounded-xl animate-pulse" style={{ width: w }} />
        ))}
      </div>
      {/* Card skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-pi-surface border border-pi-line rounded-2xl p-5 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/3 bg-white/10 rounded" />
                <div className="h-3 w-2/3 bg-white/5 rounded" />
              </div>
              <div className="h-6 w-16 bg-white/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
