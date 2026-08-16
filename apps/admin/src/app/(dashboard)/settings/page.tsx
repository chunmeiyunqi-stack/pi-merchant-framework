'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // API Token State
  const [apiKey, setApiKey] = useState('pi_sk_live_9f8d7c6b5a4e3d2c1b0a');
  const [showKey, setShowKey] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');

    if (newPassword.length < 6) {
      setErr('新密码必须至少包含 6 位字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          username: 'admin',
        }),
      });

      const json = await res.json();
      if (res.ok && json.code === 0) {
        setMsg('✅ 密码更新成功！下次登录请使用新密码。');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErr(json.msg || '修改密码失败');
      }
    } catch (_e) {
      setErr('网络连接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = () => {
    const newKey = `pi_sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
    setApiKey(newKey);
    setMsg('⚡ API Key 已成功刷新，请妥善保管新密钥。');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">系统设置与权限管理</h1>
        <p className="text-slate-400 text-xs mt-1">
          修改管理员密码、重置 API 密钥以及管理 RBAC 角色控制矩阵
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          {msg}
        </div>
      )}

      {err && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
          ⚠️ {err}
        </div>
      )}

      {/* 1. 安全密码设置 */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>🔐</span>
          <span>密码与身份验证安全</span>
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">当前原密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">新密码 (至少6位)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50"
          >
            {loading ? '保存中...' : '更新密码'}
          </button>
        </form>
      </section>

      {/* 2. API Key 开发者配置 */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>🔑</span>
          <span>Pi SDK 开发者 API 密钥</span>
        </h2>
        <p className="text-xs text-slate-400">用于 API 鉴权及 Python AI 客户端对接的服务端私钥</p>

        <div className="flex items-center gap-3 max-w-lg">
          <input
            type={showKey ? 'text' : 'password'}
            readOnly
            value={apiKey}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-white text-xs"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700"
          >
            {showKey ? '隐藏' : '显示'}
          </button>
          <button
            onClick={handleRegenerateKey}
            className="px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20"
          >
            重新生成
          </button>
        </div>
      </section>

      {/* 3. RBAC 角色权限分配矩阵 */}
      <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>🛡️</span>
          <span>RBAC 角色与权限分配 (Role-Based Access)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">功能模块</th>
                <th className="px-4 py-3">超级管理员 (OWNER)</th>
                <th className="px-4 py-3">普通店员 (STAFF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="px-4 py-3 font-semibold text-white">订单管理与退款操作</td>
                <td className="px-4 py-3 text-emerald-400">✅ 完全控制 (读/写/退款)</td>
                <td className="px-4 py-3 text-emerald-400">✅ 仅读取与确认订单</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-white">会员卡卡种创建与发卡</td>
                <td className="px-4 py-3 text-emerald-400">✅ 完全控制</td>
                <td className="px-4 py-3 text-amber-400">⚡ 仅发卡与核销</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-white">系统密钥与全局设置</td>
                <td className="px-4 py-3 text-emerald-400">✅ 完全控制</td>
                <td className="px-4 py-3 text-rose-400">❌ 无权限</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
