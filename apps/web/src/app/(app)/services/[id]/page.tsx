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
    <div className="mx-auto max-w-3xl">
      <Link href="/services" className="pi-btn-text mb-6">
        <span className="text-lg leading-none">←</span> 返回服务列表
      </Link>

      <div className="pi-card overflow-hidden">
        <div className="border-b border-pi-line p-8">
          <div className="pi-pill border-pi-gold/30 bg-pi-gold/10 text-pi-gold">★ 热门推荐</div>
          <h1 className="mt-4 text-3xl font-black leading-tight text-white">{service.title}</h1>
          <p className="mt-3 text-4xl font-black text-pi-gold">π {price.toFixed(2)}</p>
          {service.durationMinutes ? (
            <p className="mt-2 text-sm text-pi-muted">服务时长约 {service.durationMinutes} 分钟</p>
          ) : null}
        </div>

        <div className="space-y-6 p-8">
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-pi-muted">
              服务详情
            </h3>
            <div className="rounded-2xl border border-pi-line bg-white/[0.03] p-5 text-sm leading-relaxed text-white/85">
              {service.description || '暂无详细描述'}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-pi-muted">
              商家保障
            </h3>
            <ul className="space-y-3 text-sm font-medium text-white/85">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> 支持 Pi 链上安全支付
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> 专业认证保证品质
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 mt-6">
        <Link
          href={`/checkout?serviceId=${service.id}`}
          className="pi-btn-gold w-full py-4 text-base"
        >
          立即支付预约
        </Link>
      </div>
    </div>
  );
}
