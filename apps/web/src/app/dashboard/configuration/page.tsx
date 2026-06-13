import Link from 'next/link';

export default function ConfigurationPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-1">组件配置流溯源</h2>
          <p className="text-sm text-gray-500">
            追踪组件配置变更历史与版本溯源。
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 opacity-80">
        <div className="bg-gray-50 rounded-xl p-8 border border-dashed border-gray-300 text-center text-sm font-medium text-gray-500">
          ⿻ 服务端授权链路已通过验证。
          <br /> 配置流溯源于下一阶段写操作迭代后可用。
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
