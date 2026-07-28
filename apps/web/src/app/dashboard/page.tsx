import Link from 'next/link';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import LogoutButton from '@/components/LogoutButton';
import { verifySessionToken } from '@/lib/session';
import { Shield, Zap, Sparkles, Calendar, CreditCard } from '@/components/icons';

// 强制动态渲染策略，确保读取最新的 session cookie
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = cookies();
  let token = cookieStore.get('pi_auth_token')?.value;
  // 兼容 Pi Browser：如果 cookie 未被发送，从 URL 参数中获取 token
  if (!token && searchParams.token && typeof searchParams.token === 'string') {
    token = searchParams.token;
  }
  const piUid = token ? verifySessionToken(token) : null;
  // 使用 ?? 与 auth/pi/route.ts 保持一致，防止空字符串导致 merchantId 不匹配
  const merchantId =
    process.env.NEXT_PUBLIC_MERCHANT_ID ??
    process.env.NEXT_PUBLIC_DEFAULT_MERCHANT_ID ??
    'merchant-demo-001';

  let customer: any = null;
  let activeMemberships = 0;
  let totalBookings = 0;
  let totalPayments = 0;

  // P1-A: 服务端纯身份鉴权拦截
  if (piUid) {
    // 确保商户存在（与 auth route 防御逻辑一致）
    await prisma.merchant.upsert({
      where: { id: merchantId },
      update: {},
      create: { id: merchantId, name: 'Pioneer AI 商户' },
    });

    // 查找或自动创建 customer（解决 auth 与 dashboard 之间的数据一致性问题）
    customer = await prisma.customer.upsert({
      where: {
        merchantId_piUid: { merchantId, piUid },
      },
      update: {},
      create: {
        merchantId,
        piUid,
        username: piUid, // 兜底 username
      },
    });

    // 补充关联数据
    const enriched = await prisma.customer.findUnique({
      where: { id: customer.id },
      include: {
        _count: {
          select: {
            bookings: { where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } } },
            orders: { where: { status: 'COMPLETED' } },
          },
        },
        customerMemberships: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (enriched) {
      customer = enriched;
      activeMemberships = enriched.customerMemberships.length;
      totalBookings = enriched._count.bookings;
      totalPayments = enriched._count.orders;
    }
  }

  // 服务端返回无权限控制面板
  if (!customer) {
    return (
      <main className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-dark-elevated border border-brand-gold/30 flex items-center justify-center mb-6 shadow-glow-gold">
          <Shield className="w-10 h-10 text-brand-gold" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">请先完成身份验证</h1>
        <p className="text-gray-400 mb-8 max-w-md text-sm md:text-base leading-relaxed">
          此页面需要 Pi Network 链上身份授权。
          <br />
          请返回首页通过
          <strong className="text-brand-gold font-bold mx-1">Pi Wallet</strong>
          完成认证。
        </p>
        <Link
          href="/"
          className="bg-brand-gold hover:bg-brand-gold-hover text-brand-dark px-8 py-3 rounded-btn font-bold transition-colors shadow-glow-gold"
        >
          ← 返回首页
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-dark text-white flex flex-col">
      <header className="bg-brand-dark-surface border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-gold to-brand-gold-hover flex items-center justify-center">
                <Zap className="w-4 h-4 text-brand-dark" />
              </div>
            </Link>
            <h1 className="text-lg font-bold text-white">控制台</h1>
          </div>
          <div className="flex items-center space-x-4">
            <LogoutButton />
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-brand-dark-surface rounded-card border border-brand-border p-4 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 bg-brand-purple-muted text-brand-purple px-4 py-3 rounded-xl font-bold">
              概览面板
            </Link>
            <Link href="/dashboard/credentials" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
              我的业务凭证
            </Link>
            <Link href="/dashboard/support" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
              支持中心
            </Link>
            <Link href="/dashboard/configuration" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors mt-4">
              API 配置
            </Link>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <div className="bg-brand-dark-surface rounded-card border border-brand-border p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">欢迎回来，{customer.username}</h2>
              <p className="text-sm text-gray-400">您的数据已实时同步。</p>
            </div>
            <div className="hidden sm:flex w-14 h-14 rounded-full bg-brand-purple-muted items-center justify-center text-xl font-black text-brand-purple">
              {customer.username.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-brand-dark-surface rounded-card border border-brand-border p-6 relative overflow-hidden hover:border-brand-purple/30 transition-all duration-300">
              <div className="absolute right-0 top-0 w-16 h-16 bg-brand-purple-muted rounded-bl-full flex items-start justify-end p-3">
                <Sparkles className="w-5 h-5 text-brand-purple" />
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-4">当前订阅</h3>
              <p className="text-2xl font-black text-white mb-1">
                {activeMemberships > 0 ? `${activeMemberships} 项生效中` : '免费版'}
              </p>
              <Link href="/#pricing" className="text-sm font-semibold text-brand-purple hover:text-brand-purple-hover transition-colors">
                升级方案 →
              </Link>
            </div>

            <div className="bg-brand-dark-surface rounded-card border border-brand-border p-6 relative overflow-hidden hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute right-0 top-0 w-16 h-16 bg-blue-500/10 rounded-bl-full flex items-start justify-end p-3">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-4">本月预约</h3>
              <p className="text-2xl font-black text-white mb-1">
                {totalBookings} <span className="text-sm font-medium text-gray-500">次</span>
              </p>
              <span className="text-sm text-gray-500">{totalBookings > 0 ? '查看详情' : '暂无预约'}</span>
            </div>

            <div className="bg-brand-dark-surface rounded-card border border-brand-border p-6 relative overflow-hidden hover:border-brand-gold/30 transition-all duration-300">
              <div className="absolute right-0 top-0 w-16 h-16 bg-brand-gold-muted rounded-bl-full flex items-start justify-end p-3">
                <CreditCard className="w-5 h-5 text-brand-gold" />
              </div>
              <h3 className="text-sm font-semibold text-gray-400 mb-4">累计交易</h3>
              <p className="text-2xl font-black text-white mb-1">{totalPayments}</p>
              <span className="text-sm text-gray-500">On-Chain Verified</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-80 pointer-events-none">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              生态向导与履约下发流 (Construction)
            </h3>
            <div className="bg-gray-50 rounded-xl p-8 border border-dashed border-gray-300 text-center text-sm font-medium text-gray-500">
              ⿻ 服务端授权链路已通过验证。
              <br /> 此处列表详情在进行下一阶段的写操作迭代后，将可以展现与下载加密服务包。
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
