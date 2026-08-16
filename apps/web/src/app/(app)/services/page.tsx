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
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white">服务商城</h2>
        <p className="mt-1 text-sm text-pi-muted">浏览并订阅生态内可用服务，支持 π 链上结算</p>
      </div>

      {services.length === 0 ? (
        <div className="pi-card flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl">🛍️</div>
          <p className="mt-4 font-semibold text-white">暂无可用服务</p>
          <p className="mt-2 text-xs text-pi-muted">请先在后台添加并上架服务</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/services/${s.id}`}
              className="pi-card pi-card-hover group flex flex-col p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pi-violet/15 text-xl">
                🛠️
              </div>
              <h3 className="font-bold text-white">{s.title}</h3>
              {s.description && (
                <p className="mt-2 line-clamp-2 text-sm text-pi-muted">{s.description}</p>
              )}
              <div className="mt-auto flex items-end justify-between pt-5">
                <div>
                  {s.durationMinutes ? (
                    <p className="text-xs text-pi-muted">约 {s.durationMinutes} 分钟</p>
                  ) : null}
                </div>
                <p className="text-2xl font-black text-pi-gold">π {Number(s.price).toFixed(2)}</p>
              </div>
              <span className="mt-3 text-xs font-semibold text-pi-gold opacity-0 transition-opacity group-hover:opacity-100">
                查看详情 →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
