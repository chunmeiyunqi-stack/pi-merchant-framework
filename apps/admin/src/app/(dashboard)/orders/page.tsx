'use client';

// 后台 — 订单管理中心 (对接 PostgreSQL 数据库)

import { Suspense, useEffect, useState, useCallback } from 'react';
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

const STATUS_OPTIONS = [
  { key: 'ALL', label: '全部订单' },
  { key: 'PENDING_PAYMENT', label: '待支付' },
  { key: 'APPROVED', label: '已确认' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
];

function OrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams?.get('status') ?? 'ALL';
  const currentPage = parseInt(searchParams?.get('page') ?? '1', 10);

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(() => {
    if (typeof window === 'undefined') return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (currentStatus !== 'ALL') qs.set('status', currentStatus);
    qs.set('page', currentPage.toString());
    qs.set('limit', '10');

    fetch(`/api/admin/orders?${qs.toString()}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { orders: Order[]; pagination: Pagination }) => {
        setOrders(data.orders ?? []);
        setPagination(data.pagination ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentStatus, currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (status === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">订单中心</h1>
          <p className="text-slate-400 text-xs mt-1">查看、筛选并履约商户流水订单</p>
        </div>
        <button
          onClick={loadOrders}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto"
        >
          🔄 刷新数据
        </button>
      </div>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => handleStatusChange(s.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentStatus === s.key
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 订单表格 */}
      <div className="bg-slate-900/80 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
            <tr>
              {['订单号', '顾客用户名', '购买服务项目', '交易金额', '状态', '下单时间'].map((h) => (
                <th key={h} className="px-5 py-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  <div className="flex justify-center items-center gap-2">
                    <span className="animate-spin text-lg">🌀</span>
                    <span>正在加载数据库订单记录...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500">
                  <div className="text-2xl mb-2">📭</div>
                  <span>暂无符合条件的订单记录</span>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-300">{order.orderNo}</td>
                  <td className="px-5 py-4 text-purple-300 font-medium">
                    {order.customer?.username ?? '-'}
                  </td>
                  <td className="px-5 py-4 text-slate-200 font-semibold">
                    {order.service?.title ?? '-'}
                  </td>
                  <td className="px-5 py-4 text-amber-400 font-black text-sm">
                    π {Number(order.amount).toFixed(2)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        order.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : order.status === 'PENDING_PAYMENT'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                            : 'bg-slate-800 border border-slate-700 text-slate-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-mono">
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
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <div>
            共 <span className="text-white font-bold">{pagination.total}</span> 条记录，当前第{' '}
            <span className="text-purple-400 font-bold">{pagination.page}</span> /{' '}
            {pagination.totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
            >
              上一页
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
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
    <Suspense fallback={<div className="p-12 text-center text-slate-500">正在加载订单中心...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
