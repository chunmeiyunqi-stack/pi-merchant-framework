import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-1">架构与授权支持</h2>
          <p className="text-sm text-gray-500">查阅架构文档、API 密钥管理及授权链路说明。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-[#7C3AED]/30 transition-colors">
          <h3 className="font-bold text-gray-800 mb-2">架构概览</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            基于 Pi Network 生态的去中心化商户框架，提供身份鉴权、支付结算与 AI 服务调度能力。
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-[#7C3AED]/30 transition-colors">
          <h3 className="font-bold text-gray-800 mb-2">授权机制</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            通过 Pi SDK 原生身份验证与链侧签名完成授权，确保商户数据安全隔离。
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link href="/dashboard" className="text-sm text-[#7C3AED] font-bold hover:underline">
          ← 返回概览面板
        </Link>
      </div>
    </div>
  );
}
