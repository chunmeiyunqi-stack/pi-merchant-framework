'use client';

// 商户前台 — 会员中心

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Membership {
  id: string;
  name: string;
  mode: string;
  price: number;
  validDays?: number;
  totalUses?: number;
  benefitsJson?: Record<string, unknown>;
}

interface CustomerMembership {
  id: string;
  membership: { name: string };
  endAt?: string;
  remainingUses?: number;
  status: string;
}

export default function MembershipPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Membership[]>([]);
  const [myMemberships, setMyMemberships] = useState<CustomerMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/memberships').then((r) => r.json()),
      fetch('/api/memberships/mine', { credentials: 'include' }).then((r) => r.json()),
    ]).then(([plansData, myData]: [{ memberships: Membership[] }, { memberships: CustomerMembership[] }]) => {
      setPlans(plansData.memberships ?? []);
      setMyMemberships(myData.memberships ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeMembership = myMemberships.find((m) => m.status === 'ACTIVE');

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600 text-xl">←</button>
        <h1 className="font-bold text-lg text-gray-800">会员中心</h1>
      </div>

      <div className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* 当前会员状态 */}
        {activeMembership ? (
          <div className="bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⭐</span>
              <p className="font-bold">当前会员</p>
            </div>
            <p className="text-lg font-semibold">{activeMembership.membership.name}</p>
            {activeMembership.endAt && (
              <p className="text-purple-200 text-sm mt-1">
                有效至：{new Date(activeMembership.endAt).toLocaleDateString('zh-CN')}
              </p>
            )}
            {activeMembership.remainingUses !== undefined && (
              <p className="text-purple-200 text-sm mt-1">剩余次数：{activeMembership.remainingUses} 次</p>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-2xl p-5 text-center text-gray-400">
            <p>您还没有有效会员，选择下方方案立即加入！</p>
          </div>
        )}

        {/* 会员方案列表 */}
        <h2 className="font-bold text-gray-800">可购方案</h2>
        {loading ? (
          [1, 2].map((i) => <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-24" />)
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{plan.name}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {plan.mode === 'TIME_BASED' ? `有效期 ${plan.validDays} 天` : `共 ${plan.totalUses} 次`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#7C3AED] font-bold text-lg">π {Number(plan.price).toFixed(2)}</p>
                  <Link href={`/checkout?serviceId=membership_${plan.id}`}>
                    <button className="mt-2 bg-[#7C3AED] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#6D28D9] transition-colors">
                      立即购买
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
