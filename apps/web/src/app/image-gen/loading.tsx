// Server Component — Next.js App Router 自动在 Suspense 边界使用
export default function ImageGenLoading() {
  return (
    <main className="min-h-screen bg-[#0A0510] text-gray-100">
      <header className="sticky top-0 z-50 bg-[#0A0510]/80 backdrop-blur-xl border-b border-white/5 h-16" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left panel skeleton */}
          <div className="lg:col-span-2 space-y-5">
            {[180, 130, 160, 120].map((h, i) => (
              <div
                key={i}
                className="bg-[#150B20] border border-white/10 rounded-2xl animate-pulse"
                style={{ height: h }}
              />
            ))}
            <div className="h-14 bg-[#F3C136]/20 rounded-2xl animate-pulse" />
          </div>
          {/* Right panel skeleton */}
          <div className="lg:col-span-3">
            <div className="bg-[#150B20] border border-white/10 rounded-2xl aspect-square animate-pulse flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
