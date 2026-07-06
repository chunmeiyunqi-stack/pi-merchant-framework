import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const merchantId = getMerchantId();

  let service: {
    id: string;
    title: string;
    description: string | null;
    price: { toNumber?: () => number } | number;
    durationMinutes: number | null;
  } | null = null;

  try {
    service = await prisma.service.findFirst({
      where: { id: params.id, merchantId, status: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        durationMinutes: true,
      },
    });
  } catch (error) {
    console.error('[ServiceDetailPage]', error);
  }

  if (!service) {
    notFound();
  }

  const price = Number(service.price);

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col border-x border-gray-100">
      <header className="p-4 bg-white border-b border-gray-100 flex items-center">
        <Link
          href="/services"
          className="text-gray-500 hover:text-gray-800 font-medium flex items-center transition-colors"
        >
          <span className="text-xl mr-1">←</span> 返回列表
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white p-6 mb-2">
          <div className="inline-block px-3 py-1 bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-lg mb-4">
            热门推荐
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{service.title}</h1>
          <p className="text-[#7C3AED] text-4xl font-black mb-2">π {price.toFixed(2)}</p>
          {service.durationMinutes && (
            <p className="text-gray-400 text-sm mb-6">服务时长约 {service.durationMinutes} 分钟</p>
          )}

          <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">服务详情</h3>
          <div className="bg-gray-50 rounded-2xl p-5 text-gray-600 text-sm leading-relaxed border border-gray-100 shadow-inner">
            {service.description || '暂无详细描述'}
          </div>
        </div>

        <div className="bg-white p-6">
          <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wide">商家保障</h3>
          <ul className="space-y-3 text-sm font-medium text-gray-700">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> 支持 Pi 链上安全支付
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
