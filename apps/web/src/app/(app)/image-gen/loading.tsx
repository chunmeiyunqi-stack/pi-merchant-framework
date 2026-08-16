// Server Component — Next.js App Router 自动在 Suspense 边界使用
export default function ImageGenLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Left panel skeleton */}
        <div className="lg:col-span-2 space-y-5">
          {[180, 130, 160, 120].map((h, i) => (
            <div
              key={i}
              className="bg-pi-surface border border-pi-line rounded-2xl animate-pulse"
              style={{ height: h }}
            />
          ))}
          <div className="h-14 bg-pi-gold/20 rounded-2xl animate-pulse" />
        </div>
        {/* Right panel skeleton */}
        <div className="lg:col-span-3">
          <div className="bg-pi-surface border border-pi-line rounded-2xl aspect-square animate-pulse flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
