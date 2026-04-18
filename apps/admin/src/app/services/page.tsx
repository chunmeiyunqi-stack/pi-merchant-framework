'use client';

// 后台 — 服务管理

import { useEffect, useState } from 'react';

interface Service {
  id: string;
  type: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  status: string;
  createdAt: string;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/services', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { services: Service[] }) => { setServices(data.services ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">服务管理</h1>
        <button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-not-allowed opacity-50">
          + 新增服务
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['服务名称', '类型', '价格', '时长', '状态', '操作'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-300">加载中...</td></tr>
            ) : services.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">暂无服务数据</td></tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{s.title}</td>
                  <td className="px-4 py-3 text-gray-500">{s.type === 'APPOINTMENT' ? '预约制' : '其他'}</td>
                  <td className="px-4 py-3 text-[#7C3AED] font-semibold">π {Number(s.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{s.durationMinutes ? `${s.durationMinutes} 分钟` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>{s.status === 'ACTIVE' ? '上架中' : '已下架'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-[#7C3AED] hover:text-[#6D28D9] text-sm font-medium mr-3">编辑</button>
                    <button className="text-red-500 hover:text-red-600 text-sm font-medium">删除</button>
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
