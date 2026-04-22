'use client';

// 后台 — 订单管理

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface Order {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  createdAt: string;
  customer?: { username: string };
  service?: { title: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = ['ALL', 'PENDING_PAYMENT', 'APPROVED', 'COMPLETED', 'CANCELLED'];

function OrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || 'ALL';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (currentStatus !== 'ALL') qs.set('status', currentStatus);
    qs.set('page', currentPage.toString());
    qs.set('limit', '10');

    fetch(`/api/admin/orders?${qs.toString()}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { orders: Order[], pagination: Pagination }) => { 
        setOrders(data.orders ?? []); 
        setPagination(data.pagination ?? null);
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [currentStatus, currentPage]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    // Changing status resets page to 1
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">订单管理</h1>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              currentStatus === s ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? '全部' : s}
          </button>
        ))}
      </div>

      {/* 订单表格 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6">
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
                <td colSpan={6} className="text-center py-10 text-gray-400">暂无订单数据</td>
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

      {/* 分页器 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            共 {pagination.total} 条记录，当前第 {pagination.page} / {pagination.totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              上一页
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading Orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}

