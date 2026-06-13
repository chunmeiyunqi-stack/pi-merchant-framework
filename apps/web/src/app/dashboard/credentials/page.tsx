import Link from 'next/link';

export default function CredentialsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-1">我的业务凭证</h2>
          <p className="text-sm text-gray-500">
            管理已签署的链上凭证与授权记录。
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="bg-gray-50 rounded-xl p-8 border border-dashed border-gray-300 text-center text-sm font-medium text-gray-500">
          暂无凭证记录。完成配置后，此处将展现您的数字凭证档案。
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-sm text-[#7C3AED] font-bold hover:underline"
        >
          ← 返回概览面板
        </Link>
      </div>
    </div>
  );
}
