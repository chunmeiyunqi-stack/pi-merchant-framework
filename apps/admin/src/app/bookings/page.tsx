'use client';

// 后台 — 预约管理（含核销操作）

import { useEffect, useState } from 'react';

interface Booking {
  id: string;
  slotStart: string;
  slotEnd: string;
  status: string;
  note?: string;
  customer?: { username: string };
  service?: { title: string };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = () => {
    setLoading(true);
    fetch('/api/admin/bookings', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { bookings: Booking[] }) => { setBookings(data.bookings ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(fetchBookings, []);

  const handleVerify = async (bookingId: string) => {
    if (!confirm('确认核销此预约？')) return;
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/complete`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) fetchBookings();
    } catch {
      alert('核销失败，请重试');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">预约管理</h1>
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-24" />)
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📅</div>
            <p>暂无预约记录</p>
          </div>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{b.service?.title ?? '未知服务'}</p>
                  <p className="text-gray-500 text-sm mt-1">顾客：{b.customer?.username ?? '-'}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(b.slotStart).toLocaleString('zh-CN')} →{' '}
                    {new Date(b.slotEnd).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {b.note && <p className="text-gray-300 text-xs mt-1">备注：{b.note}</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    b.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                    b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{b.status}</span>

                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleVerify(b.id)}
                      className="mt-2 block bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      核销
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
