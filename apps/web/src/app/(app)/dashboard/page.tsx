import Link from 'next/link';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { verifySessionToken } from '@/lib/session';

// 强制动态渲染策略，确保读取最新的 session cookie
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

const QUICK_ACTIONS = [
  {
    label: 'AI 智能助手',
    desc: '多模型对话与流式响应',
    href: '/ai',
    icon: '💬',
    accent: 'from-violet-500/20 to-indigo-500/10 border-violet-500/20',
  },
  {
    label: '图像生成',
    desc: 'OpenAI / Anthropic / Ollama',
    href: '/image-gen',
    icon: '🎨',
    accent: 'from-pink-500/20 to-rose-500/10 border-pink-500/20',
  },
  {
    label: '服务商城',
    desc: '生态应用与订阅方案',
    href: '/services',
    icon: '🛍️',
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20',
  },
  {
    label: 'API 文档',
    desc: 'Swagger 自动生成接口',
    href: '/docs',
    icon: '📘',
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/20',
  },
];

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('pi_auth_token')?.value;
  const piUid = token ? verifySessionToken(token) : null;
  const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001';

  let customer: any = null;
  let activeMemberships = 0;
  let totalBookings = 0;
  let totalPayments = 0;

  if (piUid) {
    customer = await prisma.customer.findUnique({
      where: { merchantId_piUid: { merchantId, piUid } },
      include: {
        _count: {
          select: {
            bookings: { where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } } },
            orders: { where: { status: 'COMPLETED' } },
          },
        },
        customerMemberships: { where: { status: 'ACTIVE' } },
      },
    });

    if (customer) {
      activeMemberships = customer.customerMemberships.length;
      totalBookings = customer._count.bookings;
      totalPayments = customer._count.orders;
    }
  }

  // 未授权态：引导回首页完成 Pi 授权
  if (!customer) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-pi-line bg-pi-surface p-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-pi-gold/30 bg-pi-surface2 text-4xl shadow-pi-glow">
          π
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">需要链上身份授权</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-pi-muted">
          生态控制面板是受保护的私域。请通过底层原生的
          <strong className="mx-1 text-pi-gold">Pi Wallet 身份授权</strong>
          解锁完整功能。
        </p>
        <Link href="/" className="pi-btn-gold mt-8">
          返回首页授权
        </Link>
      </div>
    );
  }

  const stats = [
    {
      label: '生效中的凭证',
      value: activeMemberships > 0 ? `${activeMemberships} 项` : '暂无',
      sub: '会员 / 订阅授权',
      icon: '🔐',
      accent: 'from-violet-500/20 to-indigo-500/5 text-violet-300',
    },
    {
      label: '周期内排期配额',
      value: `${totalBookings} 次`,
      sub: '向导与履约预约',
      icon: '📅',
      accent: 'from-sky-500/20 to-blue-500/5 text-sky-300',
    },
    {
      label: '累计结算笔数',
      value: `${totalPayments}`,
      sub: 'Data On-Chain',
      icon: 'π',
      accent: 'from-pi-gold/20 to-amber-500/5 text-pi-gold',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* 欢迎横幅 */}
      <section className="relative overflow-hidden rounded-3xl border border-pi-gold/20 bg-gradient-to-br from-pi-surface2 via-pi-surface to-pi-bg p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pi-violet/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-pi-gold/10 blur-[100px]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="pi-pill border-pi-gold/30 bg-pi-gold/10 text-pi-gold">
              <span className="h-1.5 w-1.5 animate-pi-pulse rounded-full bg-pi-gold" />
              生态节点已同步
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              欢迎回来，{customer.username}
            </h2>
            <p className="mt-2 text-sm text-pi-muted">
              以下参数已实时同步您的生态节点与历史凭证档案。
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-pi-gold/30 bg-pi-surface2 text-3xl font-black text-pi-gold shadow-pi-glow">
            {customer.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </section>

      {/* 统计卡片 */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="pi-card pi-card-hover relative overflow-hidden p-6">
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${s.accent}`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-pi-muted">
                  {s.label}
                </p>
                <p className="mt-3 text-3xl font-black text-white">{s.value}</p>
                <p className="mt-1.5 text-xs text-pi-muted">{s.sub}</p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-xl ${s.accent}`}
              >
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 快捷入口 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">快捷启动</h3>
          <span className="text-xs text-pi-muted">常用功能一键直达</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="pi-card pi-card-hover group flex flex-col gap-3 p-5"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br text-xl ${a.accent}`}
              >
                {a.icon}
              </div>
              <div>
                <p className="font-bold text-white">{a.label}</p>
                <p className="mt-1 text-xs text-pi-muted">{a.desc}</p>
              </div>
              <span className="mt-auto text-xs font-semibold text-pi-gold opacity-0 transition-opacity group-hover:opacity-100">
                立即使用 →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 生态状态 */}
      <section className="pi-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">生态履约流</h3>
            <p className="mt-1 text-xs text-pi-muted">
              服务端授权链路已通过验证，加密服务包将随下一阶段迭代开放下载。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="pi-pill border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              ● 授权链路正常
            </span>
            <Link href="/#pricing" className="pi-btn-ghost">
              升级方案
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
