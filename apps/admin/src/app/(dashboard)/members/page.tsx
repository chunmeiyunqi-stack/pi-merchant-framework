'use client';

import { useEffect, useState } from 'react';

interface MembershipItem {
  id: string;
  name: string;
  mode: string;
  price: number;
  validDays?: number;
}

export default function MembersPage() {
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 发卡 modal 状态
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [targetPiUid, setTargetPiUid] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);

  // 核销 modal 状态
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [cardIdToVerify, setCardIdToVerify] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const loadMemberships = () => {
    fetch('/api/admin/memberships', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 0 && data.data?.memberships) {
          setMemberships(data.data.memberships);
        } else {
          setMemberships(data.memberships || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadMemberships();
  }, []);

  // 提交发卡
  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    setMessage('');

    if (!selectedMembershipId) {
      setErrMsg('请先选择要发放的会员卡规格');
      return;
    }

    setIssueLoading(true);
    try {
      const res = await fetch('/api/admin/memberships/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: selectedMembershipId,
          customerUsername: targetUsername,
          customerPiUid: targetPiUid,
        }),
      });

      const json = await res.json();
      if (res.ok && json.code === 0) {
        setMessage('✅ 会员卡已成功发放给目标用户！');
        setShowIssueModal(false);
        setTargetUsername('');
        setTargetPiUid('');
      } else {
        setErrMsg(json.msg || '发放会员卡失败');
      }
    } catch (_e) {
      setErrMsg('网络连接失败');
    } finally {
      setIssueLoading(false);
    }
  };

  // 提交核销
  const handleVerifyCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    setMessage('');

    if (!cardIdToVerify) {
      setErrMsg('请输入会员卡记录 ID');
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await fetch('/api/admin/memberships/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerMembershipId: cardIdToVerify,
          redeemUses: 1,
        }),
      });

      const json = await res.json();
      if (res.ok && json.code === 0) {
        setMessage(`✅ 核销成功！当前扣减 1 次使用额度。`);
        setShowVerifyModal(false);
        setCardIdToVerify('');
      } else {
        setErrMsg(json.msg || '会员卡核销失败');
      }
    } catch (_e) {
      setErrMsg('网络连接失败');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">会员卡与权益体系</h1>
          <p className="text-slate-400 text-xs mt-1">发放、管理商户会员卡、储值卡与使用次数核销</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVerifyModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs hover:bg-slate-700 transition-colors shadow-md"
          >
            ⚡ 快捷核销
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:brightness-110 shadow-md shadow-purple-600/20"
          >
            + 发行新会员卡
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          {message}
        </div>
      )}

      {errMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
          ⚠️ {errMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse p-6"
            />
          ))
        ) : memberships.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
            <div className="text-3xl mb-2">💳</div>
            <span>暂未配置会员卡规格</span>
          </div>
        ) : (
          memberships.map((m) => (
            <div
              key={m.id}
              className="p-6 rounded-3xl bg-gradient-to-b from-purple-900/30 to-slate-900 border border-purple-500/20 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                    {m.mode}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {m.validDays ? `${m.validDays} 天有效` : '永久'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">{m.name}</h3>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">售卖价格</span>
                <span className="text-2xl font-black text-amber-400">
                  π {Number(m.price).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 发卡 Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">🪪 向客户发放会员卡</h2>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>
            <form onSubmit={handleIssueCard} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">选择会员卡规格</label>
                <select
                  value={selectedMembershipId}
                  onChange={(e) => setSelectedMembershipId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  required
                >
                  <option value="">-- 请选择 --</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (π {m.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">客户用户名</label>
                <input
                  type="text"
                  placeholder="例如: pioneer_jack"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  客户 Pi UID (可选)
                </label>
                <input
                  type="text"
                  placeholder="例如: pi_uid_10086"
                  value={targetPiUid}
                  onChange={(e) => setTargetPiUid(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={issueLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg disabled:opacity-50"
              >
                {issueLoading ? '正在发放...' : '确认发放会员卡'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 核销 Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">⚡ 会员卡使用核销</h2>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>
            <form onSubmit={handleVerifyCard} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  会员卡记录 ID (CustomerMembership ID)
                </label>
                <input
                  type="text"
                  placeholder="输入卡号或记录 ID"
                  value={cardIdToVerify}
                  onChange={(e) => setCardIdToVerify(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg disabled:opacity-50"
              >
                {verifyLoading ? '正在核销...' : '验证并扣减 1 次额度'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
