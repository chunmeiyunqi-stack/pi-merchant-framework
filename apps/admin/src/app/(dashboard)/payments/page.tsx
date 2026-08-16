'use client';

// 支付流水与对账中心 — 连接底层 Payment 表

import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  piPaymentId: string;
  txid?: string;
  amount: number;
  status: string;
  createdAt: string;
  order?: { orderNo: string };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/admin/payments', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setPayments(data.payments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">支付流水与对账</h1>
          <p className="text-slate-400 text-xs mt-1">Pi SDK 链上交易与本地 Order 对账审计</p>
        </div>
      </div>

      <div className="bg-slate-900/80 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
            <tr>
              {['Pi Payment ID', '关联订单号', '区块链 TXID', '金额', '状态', '创建时间'].map(
                (h) => (
                  <th key={h} className="px-5 py-4">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  <div className="flex justify-center items-center gap-2">
                    <span className="animate-spin text-lg">🌀</span>
                    <span>正在同步支付流水数据...</span>
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500">
                  <div className="text-2xl mb-2">💸</div>
                  <span>暂无支付流水记录</span>
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-300">{p.piPaymentId}</td>
                  <td className="px-5 py-4 font-mono text-purple-300">{p.order?.orderNo ?? '-'}</td>
                  <td className="px-5 py-4 font-mono text-slate-400 truncate max-w-[150px]">
                    {p.txid || '未上链/待确认'}
                  </td>
                  <td className="px-5 py-4 text-amber-400 font-black text-sm">
                    π {Number(p.amount).toFixed(2)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        p.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 font-mono">
                    {new Date(p.createdAt).toLocaleString('zh-CN')}
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
