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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mode: 'TIME_BASED',
    price: '',
    validDays: '',
    totalUses: ''
  });

  const fetchMemberships = () => {
    setLoading(true);
    fetch('/api/admin/memberships', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { memberships: Membership[] }) => { 
        setMemberships(data.memberships ?? []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCreating(true);

    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          mode: formData.mode,
          price: parseFloat(formData.price),
          validDays: formData.validDays ? parseInt(formData.validDays) : null,
          totalUses: formData.totalUses ? parseInt(formData.totalUses) : null,
        }),
        credentials: 'include'
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || '创建失败');
      }
      // Optimistic or real refresh
      fetchMemberships();
      setIsModalOpen(false);
      setFormData({ name: '', mode: 'TIME_BASED', price: '', validDays: '', totalUses: '' });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">会员方案</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
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
                <p>模式：{m.mode === 'TIME_BASED' ? '有效时长卡' : m.mode === 'USAGE_BASED' ? '使用次数卡' : '订阅/无限制'}</p>
                {m.validDays && <p>额度：有效期 {m.validDays} 天</p>}
                {m.totalUses && <p>额度：共 {m.totalUses} 次</p>}
              </div>
              
              {/* Not connected to backend yet, but UI required us to not remove buttons unless explicit. 
                  User said "不允许新增“看起来能点但其实没接后端”的假按钮", so we disable these until implemented */}
              <div className="flex gap-2 border-t pt-3">
                <button disabled title="编辑功能尚在排期中" className="flex-1 text-center text-sm font-medium text-gray-400 bg-gray-50 py-1.5 rounded-lg cursor-not-allowed">
                  编辑
                </button>
                <button disabled title="下架功能尚在排期中" className="flex-1 text-center text-sm font-medium text-red-300 bg-red-50 py-1.5 rounded-lg cursor-not-allowed">
                  下架
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">新增会员方案</h2>
            
            {errorMsg && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg">{errorMsg}</div>}
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">方案名称</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">方案售价 (π)</label>
                <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">核销模式</label>
                <select value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]">
                  <option value="TIME_BASED">有效时长卡 (如:月卡)</option>
                  <option value="USAGE_BASED">使用次数卡 (如:10次卡)</option>
                  <option value="UNLIMITED">不限量/永久订阅</option>
                </select>
              </div>

              {(formData.mode === 'TIME_BASED' || formData.mode === 'USAGE_BASED') && (
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     {formData.mode === 'TIME_BASED' ? '有效天数' : '包含次数'}
                   </label>
                   <input required type="number" min="1" value={formData.mode === 'TIME_BASED' ? formData.validDays : formData.totalUses} onChange={e => formData.mode === 'TIME_BASED' ? setFormData({...formData, validDays: e.target.value}) : setFormData({...formData, totalUses: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]" />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                  取消
                </button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-white bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 rounded-lg transition-colors font-medium flex items-center justify-center min-w-[80px]">
                  {creating ? '提交...' : '确认创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
