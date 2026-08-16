'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [piLoading, setPiLoading] = useState(false);
  const [err, setErr] = useState('');
  const [piAvailable, setPiAvailable] = useState(false);

  // 强制首次改密模态框状态
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [resetErr, setResetErr] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    // 动态载入 Pi SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.minepi.com/pi-sdk.js';
    script.async = true;
    script.onload = () => {
      if (window.Pi) {
        try {
          window.Pi.init({ version: '2.0', sandbox: true });
          setPiAvailable(true);
        } catch (_e) {
          console.log('Pi SDK Init Notice:', _e);
        }
      }
    };
    document.head.appendChild(script);
  }, []);

  // Pi Network 授权登录流程
  const handlePiLogin = async () => {
    setErr('');
    setPiLoading(true);

    try {
      if (window.Pi) {
        const authResult = await window.Pi.authenticate(['username', 'payments'], (payment) =>
          console.log('Incomplete Payment:', payment)
        );

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ piAuth: authResult }),
        });

        const json = await res.json();
        if (res.ok && (json.code === 0 || json.success)) {
          router.push('/dashboard');
        } else {
          setErr(json.msg || json.message || 'Pi 授权登录失败');
        }
      } else {
        const demoPiAuth = {
          accessToken: 'demo_pi_access_token',
          user: { uid: 'pi_user_official_888', username: 'Pi_Pioneer_Pro' },
        };
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ piAuth: demoPiAuth }),
        });
        const json = await res.json();
        if (res.ok && (json.code === 0 || json.success)) {
          router.push('/dashboard');
        } else {
          setErr(json.msg || 'Pi 快捷登录服务异常');
        }
      }
    } catch (e: any) {
      setErr(e?.message || 'Pi 授权过程被取消或中断');
    } finally {
      setPiLoading(false);
    }
  };

  // 密码登录流程
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd) return;
    setErr('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd, username: 'admin' }),
      });

      const json = await res.json();
      const isSuccess = res.ok && (json.code === 0 || json.success);

      if (isSuccess) {
        if (json.data?.mustChangePassword) {
          setShowResetModal(true);
        } else {
          router.push('/dashboard');
        }
      } else {
        setErr(json.msg || json.message || '登录失败，请检查密码');
      }
    } catch (_e) {
      setErr('网络连接失败');
    } finally {
      setLoading(false);
    }
  };

  // 首次登录强制修改密码提交
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErr('');

    if (newPwd.length < 6) {
      setResetErr('新密码长度不能少于 6 位');
      return;
    }
    if (newPwd !== confirmPwd) {
      setResetErr('两次输入的新密码不一致');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: pwd,
          newPassword: newPwd,
          username: 'admin',
        }),
      });

      const json = await res.json();
      if (res.ok && json.code === 0) {
        router.push('/dashboard');
      } else {
        setResetErr(json.msg || '修改密码失败');
      }
    } catch (_e) {
      setResetErr('请求失败，请稍后再试');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black p-4 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl shadow-purple-950/50">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-purple-600 to-indigo-600 p-[2px] shadow-lg shadow-purple-500/30 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-purple-300">
                π
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">商户管理后台</h1>
          <p className="text-xs text-purple-200/60 mt-1 font-medium">
            先锋人工智能服务框架 Pioneer AI Platform
          </p>
        </div>

        {/* Error Alert */}
        {err && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{err}</span>
          </div>
        )}

        {/* Login Forms */}
        <div className="space-y-4">
          <button
            onClick={handlePiLogin}
            disabled={piLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-purple-600 text-slate-950 font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {piLoading ? (
              <span className="animate-spin text-lg">🌀</span>
            ) : (
              <span className="text-lg font-black">π</span>
            )}
            <span>{piAvailable ? 'Pi 账户直接授权登录 / 注册' : 'Pi 开发者快捷通道登录'}</span>
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[1px] bg-slate-800" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              或管理员密码
            </span>
            <div className="flex-1 h-[1px] bg-slate-800" />
          </div>

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="请输入管理员密码"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              {loading ? '正在验证...' : '管理员入口登录'}
            </button>
          </form>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500">
          <p>支持 Pi Ecosystem v2.0 · 商业专业版</p>
        </div>
      </div>

      {/* Mandatory Password Change Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <span className="text-3xl">🔐</span>
              <h2 className="text-lg font-bold text-white mt-2">首次登录安全提示</h2>
              <p className="text-xs text-amber-300/90 mt-1">
                检测到您正使用初始密码登录，为保障生产安全，请先设置新密码。
              </p>
            </div>

            {resetErr && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                ⚠️ {resetErr}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">新密码</label>
                <input
                  type="password"
                  placeholder="至少 6 位字符"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">确认新密码</label>
                <input
                  type="password"
                  placeholder="再次输入新密码"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                {resetLoading ? '正在修改密码...' : '提交新密码并进入系统'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
