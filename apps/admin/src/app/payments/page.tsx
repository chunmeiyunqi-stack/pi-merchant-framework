'use client';

// 后台 — 支付记录

import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  piPaymentId: string;
  txid?: string;
  amount: number;
  status: string;
  developerApproved: boolean;
  developerCompleted: boolean;
  createdAt: string;
  completedAt?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/payments', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { payments: Payment[] }) => { setPayments(data.payments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">支付记录</h1>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Pi Payment ID', '链上 TxID', '金额', '状态', '已审批', '已完成', '时间'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-300">加载中...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">暂无支付记录</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[140px] truncate" title={p.piPaymentId}>
                      {p.piPaymentId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[120px] truncate" title={p.txid ?? ''}>
                      {p.txid ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-[#7C3AED] font-semibold">π {Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg ${
                        p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        p.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{p.developerApproved ? '✅' : '❌'}</td>
                    <td className="px-4 py-3 text-center">{p.developerCompleted ? '✅' : '❌'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
