'use client';

import React, { useState } from 'react';

function PrivacyPolicyContent() {
  return (
    <div className="text-sm text-gray-700 space-y-3 leading-relaxed">
      <h3 className="font-semibold text-gray-900 text-base">隐私政策</h3>
      <p>先锋 AI 商户服务框架（以下简称「本框架」）非常重视用户隐私保护。</p>
      <p><strong>数据收集：</strong>本框架仅收集您在使用服务过程中主动提供的必要信息，包括账户信息、交易记录及操作日志。</p>
      <p><strong>数据使用：</strong>收集的数据仅用于提供和改善服务、保障账户安全及满足法律法规要求，不会向无关第三方出售或共享。</p>
      <p><strong>数据安全：</strong>我们采用行业标准的加密技术和安全措施保护您的数据，防止未经授权的访问、泄露或滥用。</p>
      <p><strong>Cookie：</strong>本框架使用必要的 Cookie 以维持会话状态，不使用用于追踪的第三方 Cookie。</p>
      <p><strong>您的权利：</strong>您有权随时查询、更正或删除您的个人数据，请通过官方渠道联系我们。</p>
      <p className="text-gray-500 text-xs">最后更新：2026 年 6 月</p>
    </div>
  );
}

function DisclaimerContent() {
  return (
    <div className="text-sm text-gray-700 space-y-3 leading-relaxed">
      <h3 className="font-semibold text-gray-900 text-base">免责声明</h3>
      <p><strong>独立开发声明：</strong>本框架由社区开发者独立创作，与 Pi Network 核心团队无直接关联，亦非 Pi Network 官方产品。</p>
      <p><strong>投资风险：</strong>Pi 及相关数字资产的价值可能大幅波动。本框架不构成任何投资建议，用户应自行承担使用风险。</p>
      <p><strong>服务可用性：</strong>本框架按「现状」提供服务，不对服务的持续可用性、准确性或完整性作出任何明示或暗示的保证。</p>
      <p><strong>第三方服务：</strong>本框架集成的第三方 API 及服务受其各自条款约束，本框架不为第三方服务的行为承担责任。</p>
      <p><strong>法律合规：</strong>用户有责任确保其使用行为符合所在司法管辖区的相关法律法规。</p>
      <p className="text-xs text-gray-400 uppercase tracking-wide">DISCLAIMER: THIS FRAMEWORK IS INDEPENDENTLY AUTHORED BY COMMUNITY DEVELOPERS AND IS NOT AN OFFICIAL PI NETWORK PRODUCT.</p>
    </div>
  );
}

export default function FooterLegal() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <footer className="bg-white border-t mt-8" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">先锋 AI 商户服务框架 V2.1.0</div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowPrivacy((s) => !s); setShowDisclaimer(false); }}
              className="text-sm text-blue-600 hover:underline focus:outline-none" type="button"
            >
              {showPrivacy ? '▲ 隐私政策' : '▼ 隐私政策'}
            </button>
            <button
              onClick={() => { setShowDisclaimer((s) => !s); setShowPrivacy(false); }}
              className="text-sm text-blue-600 hover:underline focus:outline-none" type="button"
            >
              {showDisclaimer ? '▲ 免责声明' : '▼ 免责声明'}
            </button>
          </div>
        </div>

        {(showPrivacy || showDisclaimer) && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
            {showPrivacy && <PrivacyPolicyContent />}
            {showDisclaimer && <DisclaimerContent />}
          </div>
        )}
      </div>
    </footer>
  );
}

