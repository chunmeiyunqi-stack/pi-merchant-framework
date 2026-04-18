'use client';

// 后台 — 订单管理

import { useEffect, useState } from 'react';

interface Order {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  createdAt: string;
  customer?: { username: string };
  service?: { title: string };
}

const STATUS_OPTIONS = ['ALL', 'PENDING_PAYMENT', 'APPROVED', 'COMPLETED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = filter !== 'ALL' ? `?status=${filter}` : '';
    fetch(`/api/admin/orders${qs}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { orders: Order[] }) => { setOrders(data.orders ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">订单管理</h1>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === s ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? '全部' : s}
          </button>
        ))}
      </div>

      {/* 订单表格 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['订单号', '顾客', '服务', '金额', '状态', '下单时间'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-300">加载中...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">暂无订单</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{order.orderNo}</td>
                  <td className="px-4 py-3 text-gray-700">{order.customer?.username ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{order.service?.title ?? '-'}</td>
                  <td className="px-4 py-3 text-[#7C3AED] font-semibold">π {Number(order.amount).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">{order.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
