'use client';

// 商户前台 — 我的订单

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  createdAt: string;
  service?: { title: string };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'text-gray-400' },
  PENDING_PAYMENT: { label: '待支付', color: 'text-orange-500' },
  COMPLETED: { label: '已完成', color: 'text-green-600' },
  CANCELLED: { label: '已取消', color: 'text-red-400' },
  REFUNDED: { label: '已退款', color: 'text-blue-400' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { orders: Order[] }) => { setOrders(data.orders ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <h1 className="font-bold text-lg text-gray-800">我的订单</h1>
      </div>

      <div className="max-w-md mx-auto px-4 mt-4 space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p>暂无订单</p>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, color: 'text-gray-400' };
            return (
              <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-800 text-sm">{order.service?.title ?? '未知服务'}</p>
                  <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                <p className="text-gray-400 text-xs">订单号：{order.orderNo}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
                  <span className="text-[#7C3AED] font-bold">π {Number(order.amount).toFixed(2)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
