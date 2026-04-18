'use client';

// 商户前台 — 服务列表

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Service {
  id: string;
  title: string;
  description?: string;
  price: number;
  durationMinutes?: number;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data: { services: Service[] }) => {
        setServices(data.services ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <h1 className="font-bold text-lg text-gray-800">全部服务</h1>
      </div>

      <div className="max-w-md mx-auto px-4 mt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p>暂无可用服务</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <Link key={service.id} href={`/services/${service.id}`}>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-purple-200 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h2 className="font-semibold text-gray-800">{service.title}</h2>
                      {service.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{service.description}</p>
                      )}
                      {service.durationMinutes && (
                        <p className="text-gray-400 text-xs mt-2">⏱ {service.durationMinutes} 分钟</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#7C3AED] font-bold text-lg">π {Number(service.price).toFixed(2)}</p>
                      <button className="mt-2 bg-[#7C3AED] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#6D28D9] transition-colors">
                        预约
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
