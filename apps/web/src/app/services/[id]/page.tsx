import Link from 'next/link';

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  // Normally: query actual service by ID from DB or API
  const service = {
    id: params.id,
    title: '高级光疗美甲',
    description: '采用顶级环保光疗胶，色彩饱和度高，持久不脱落（平均可维持30-40天）。包含完整的日式手部死皮特护及抛光处理，由具有5年资历以上的资深美甲师全程为您操作。过程温馨无痛。',
    price: 12.0
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col border-x border-gray-100">
      <header className="p-4 bg-white border-b border-gray-100 flex items-center">
        <Link href="/" className="text-gray-500 hover:text-gray-800 font-medium flex items-center transition-colors">
          <span className="text-xl mr-1">←</span> 返回列表
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white p-6 mb-2">
          <div className="inline-block px-3 py-1 bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-lg mb-4 cursor-default">热门推荐</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{service.title}</h1>
          <p className="text-[#7C3AED] text-4xl font-black mb-6">π {service.price.toFixed(2)}</p>
          
          <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">服务详情</h3>
          <div className="bg-gray-50 rounded-2xl p-5 text-gray-600 text-sm leading-relaxed border border-gray-100 shadow-inner">
            {service.description}
          </div>
        </div>
        
        <div className="bg-white p-6">
          <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wide">商家保障</h3>
          <ul className="space-y-3 text-sm font-medium text-gray-700">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> 支持 Pi 链上安全支付
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> 服务前随时可申请退掉 (P2)
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> 专业认证保证品质
            </li>
          </ul>
        </div>
      </div>

      <div className="p-5 bg-white border-t border-gray-100 sticky bottom-0">
        <Link 
          href={`/checkout?serviceId=${service.id}`}
          className="block w-full text-center bg-[#7C3AED] text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-[#6D28D9] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          立即支付预约
        </Link>
      </div>
    </main>
  );
}
