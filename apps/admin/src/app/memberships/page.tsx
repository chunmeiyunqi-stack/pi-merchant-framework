'use client';

// 后台 — 会员方案管理

import { useEffect, useState } from 'react';

interface Membership {
  id: string;
  name: string;
  mode: string;
  price: number;
  validDays: number | null;
  totalUses: number | null;
  status: string;
}

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/memberships', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { memberships: Membership[] }) => { setMemberships(data.memberships ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">会员方案</h1>
        <button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-not-allowed opacity-50">
          + 新增方案
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-32" />)
        ) : memberships.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">⭐</div>
            <p>暂无会员方案</p>
          </div>
        ) : (
          memberships.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg">{m.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>{m.status === 'ACTIVE' ? '生效中' : '已下架'}</span>
              </div>
              <p className="text-[#7C3AED] font-bold text-2xl mb-4">π {Number(m.price).toFixed(2)}</p>
              
              <div className="text-sm text-gray-500 mt-auto mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p>模式：{m.mode === 'TIME_BASED' ? '有效时长卡' : m.mode === 'COUNT_BASED' ? '使用次数卡' : '订阅'}</p>
                {m.validDays && <p>额度：有效期 {m.validDays} 天</p>}
                {m.totalUses && <p>额度：共 {m.totalUses} 次</p>}
              </div>
              
              <div className="flex gap-2 border-t pt-3">
                <button className="flex-1 text-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 py-1.5 rounded-lg transition-colors">
                  编辑
                </button>
                <button className="flex-1 text-center text-sm font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 py-1.5 rounded-lg transition-colors">
                  下架
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
