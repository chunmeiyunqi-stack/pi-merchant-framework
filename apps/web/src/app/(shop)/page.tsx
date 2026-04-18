'use client';

// 商户前台 — 首页（按配置显示入口）

import Link from 'next/link';

export default function ShopHomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部商户 Banner */}
      <div className="bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-white px-5 pt-10 pb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
            π
          </div>
          <div>
            <h1 className="font-bold text-xl">Pi 商户服务</h1>
            <p className="text-purple-200 text-sm">专业服务，Pi 支付</p>
          </div>
        </div>
      </div>

      {/* 功能入口卡片 */}
      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '服务预约', icon: '📅', href: '/services', color: 'bg-purple-50 border-purple-100' },
            { label: '我的会员', icon: '⭐', href: '/membership', color: 'bg-yellow-50 border-yellow-100' },
            { label: '我的订单', icon: '📋', href: '/orders', color: 'bg-blue-50 border-blue-100' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`${item.color} border rounded-2xl p-4 text-center hover:scale-105 transition-transform`}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-xs font-medium text-gray-700">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* 热门服务 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">热门服务</h2>
          <div className="space-y-3">
            {[
              { title: '基础护理', price: 5.0, duration: 60 },
              { title: '高级护理', price: 12.0, duration: 90 },
            ].map((s, i) => (
              <Link key={i} href={`/services`}>
                <div className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">{s.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">⏱ {s.duration} 分钟</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#7C3AED] font-bold">π {s.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">立即预约 →</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
