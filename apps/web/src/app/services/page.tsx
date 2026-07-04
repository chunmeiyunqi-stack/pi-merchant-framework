import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getMerchantId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const merchantId = getMerchantId();

  let services: {
    id: string;
    title: string;
    description: string | null;
    price: { toNumber?: () => number } | number;
    durationMinutes: number | null;
  }[] = [];

  try {
    services = await prisma.service.findMany({
      where: { merchantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        durationMinutes: true,
      },
    });
  } catch (error) {
    console.error('[ServicesPage]', error);
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col border-x border-gray-100">
      <header className="p-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-800 font-medium flex items-center transition-colors"
        >
          <span className="text-xl mr-1">←</span> 返回
        </Link>
        <h1 className="text-lg font-bold text-gray-800">服务列表</h1>
        <span className="w-12" />
      </header>

      <div className="flex-1 p-4 space-y-3">
        {services.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🛍️</div>
            <p>暂无可用服务</p>
            <p className="text-xs mt-2">请先在后台添加并上架服务</p>
          </div>
        ) : (
          services.map((s) => (
            <Link
              key={s.id}
              href={`/services/${s.id}`}
              className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-[#7C3AED]/30 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 truncate">{s.title}</h2>
                  {s.description && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{s.description}</p>
                  )}
                  {s.durationMinutes && (
                    <p className="text-gray-400 text-xs mt-2">约 {s.durationMinutes} 分钟</p>
                  )}
                </div>
                <p className="text-[#7C3AED] text-xl font-black shrink-0">
                  π {Number(s.price).toFixed(2)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
