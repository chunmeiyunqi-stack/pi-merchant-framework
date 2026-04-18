'use client';

// 后台 — 店铺设置

import { useEffect, useState } from 'react';

interface AppConfigForm {
  name: string;
  contactPhone: string;
  industrySkin: string;
  homepageLayout: string;
  modulesBooking: boolean;
  modulesMembership: boolean;
  enableCoupon: boolean;
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<AppConfigForm>({
    name: '',
    contactPhone: '',
    industrySkin: 'generic',
    homepageLayout: 'service-first',
    modulesBooking: true,
    modulesMembership: false,
    enableCoupon: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { config: AppConfigForm }) => { if (data.config) setForm(data.config); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof AppConfigForm) =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">店铺设置</h1>

      <div className="max-w-lg space-y-6">
        {/* 基础信息 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-700">基础信息</h2>
          {[
            { label: '商户名称', key: 'name' as keyof AppConfigForm, type: 'text' },
            { label: '联系电话', key: 'contactPhone' as keyof AppConfigForm, type: 'tel' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm text-gray-500 mb-1">{f.label}</label>
              <input
                type={f.type}
                value={String(form[f.key])}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
          ))}
        </div>

        {/* 行业皮肤 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">行业皮肤</h2>
          <select
            value={form.industrySkin}
            onChange={(e) => setForm((prev) => ({ ...prev, industrySkin: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]"
          >
            {['beauty', 'fitness', 'education', 'consulting', 'repair', 'generic'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 模块开关 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-700">功能开关</h2>
          {[
            { key: 'modulesBooking', label: '预约管理' },
            { key: 'modulesMembership', label: '会员方案' },
            { key: 'enableCoupon', label: '优惠券（P2）' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{label}</span>
              <button
                onClick={() => toggle(key as keyof AppConfigForm)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  form[key as keyof AppConfigForm] ? 'bg-[#7C3AED]' : 'bg-gray-200'
                }`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                  form[key as keyof AppConfigForm] ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saved ? '✓ 已保存' : saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
