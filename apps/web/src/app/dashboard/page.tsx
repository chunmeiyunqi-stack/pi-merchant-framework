import Link from 'next/link';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import LogoutButton from '@/components/LogoutButton';
import { verifySessionToken } from '@/lib/session';

// 强制动态渲染策略，确保读取最新的 session cookie
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('pi_auth_token')?.value;
  const piUid = token ? verifySessionToken(token) : null;
  const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID || 'merchant-demo-001';

  let customer = null;
  let activeMemberships = 0;
  let totalBookings = 0;
  let totalPayments = 0;

  // P1-A: 服务端纯身份鉴权拦截
  if (piUid) {
    customer = await prisma.customer.findUnique({
      where: {
        merchantId_piUid: { merchantId, piUid }
      },
      include: {
        _count: {
          select: {
             bookings: { where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } } },
             orders: { where: { status: 'COMPLETED' } }
          }
        },
        customerMemberships: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (customer) {
      activeMemberships = customer.customerMemberships.length;
      totalBookings = customer._count.bookings;
      totalPayments = customer._count.orders;
    }
  }

  // 服务端返回无权控制面板
  if (!customer) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#1E112A] to-[#110B19] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-[#2A1642] border border-[#F3C136]/30 rounded-full flex items-center justify-center text-3xl mb-6 shadow-lg shadow-[#F3C136]/10">
          🔒
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">无权操作</h1>
        <p className="text-gray-400 mb-8 max-w-md text-sm md:text-base leading-relaxed">
          生态控制面板是被严密保护的专属私域。您必须退回首页，并通过底层原生的 
          <strong className="text-[#F3C136] font-bold mx-1">链侧身份授权</strong> 
          机制后方可解锁此页面。
        </p>
        <Link 
          href="/" 
          className="bg-[#F3C136] hover:bg-[#EEA834] text-[#1E112A] px-8 py-3 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(243,193,54,0.3)] hover:-translate-y-0.5 transform"
        >
          ← 返回大厅
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <div className="w-8 h-8 rounded-lg bg-[#1E112A] flex items-center justify-center text-white font-bold cursor-pointer">
                AI
              </div>
            </Link>
            <h1 className="text-lg font-bold text-gray-800">控制台管理中心</h1>
          </div>
          <div className="flex items-center space-x-4">
            <LogoutButton />
            <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-800">返回主页</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 flex flex-col md:flex-row gap-6">
        
        {/* 左侧导航 */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-1">
            <div className="bg-purple-50 text-[#7C3AED] px-4 py-3 rounded-xl font-bold cursor-pointer">概览面板</div>
            <div className="text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium cursor-pointer transition-colors">我的业务凭证</div>
            <div className="text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium cursor-pointer transition-colors">架构与问答支持</div>
            <div className="text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium cursor-pointer transition-colors mt-4">组件配置流溯源 🔒</div>
          </div>
        </aside>

        {/* 主内容区数据绑定 */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-1">欢迎回归，{customer.username} 👋</h2>
              <p className="text-sm text-gray-500">以下参数已实时同步您的生态节点与历史凭证档案流。</p>
            </div>
            <div className="hidden sm:block w-16 h-16 bg-[#3B2D4F] rounded-full flex items-center justify-center text-2xl font-black text-[#F3C136] shadow-inner">
              {customer.username.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#7C3AED]/30 transition-colors">
              <div className="absolute right-0 top-0 w-16 h-16 bg-indigo-50 rounded-bl-full flex items-start justify-end p-3 pointer-events-none">
                <span className="text-indigo-400">⚡</span>
              </div>
              <h3 className="text-sm font-bold text-gray-500 mb-4">当前配置凭证</h3>
              <p className="text-2xl font-black text-gray-900 mb-1">
                {activeMemberships > 0 ? `${activeMemberships} 项生效中` : '暂无参数'}
              </p>
              <Link href="/#pricing" className="text-sm text-[#7C3AED] font-bold hover:underline">前去研讨加配 →</Link>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="absolute right-0 top-0 w-16 h-16 bg-blue-50 rounded-bl-full flex items-start justify-end p-3 pointer-events-none">
                <span className="text-blue-400">🎫</span>
              </div>
              <h3 className="text-sm font-bold text-gray-500 mb-4">周期内向导排期配额</h3>
              <p className="text-2xl font-black text-gray-900 mb-1">{totalBookings} <span className="text-sm font-medium text-gray-400">次</span></p>
              <button className="text-sm text-gray-400 font-medium cursor-not-allowed">
                {totalBookings > 0 ? "查看履约快照" : "基础版存在限制"}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-16 h-16 bg-orange-50 rounded-bl-full flex items-start justify-end p-3 pointer-events-none">
                <span className="text-orange-400">π</span>
              </div>
              <h3 className="text-sm font-bold text-gray-500 mb-4">累计结算笔数</h3>
              <p className="text-2xl font-black text-gray-900 mb-1">{totalPayments}</p>
              <span className="text-sm text-gray-400 font-medium">Data On-Chain</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-80 pointer-events-none">
            <h3 className="text-lg font-bold text-gray-800 mb-4">生态向导与履约下发流 (Construction)</h3>
            <div className="bg-gray-50 rounded-xl p-8 border border-dashed border-gray-300 text-center text-sm font-medium text-gray-500">
               ⚠️ 服务端授权链路已通过验证。<br/> 此处列表详情在进行下一阶段的写操作迭代后，将可以展现与下载加密服务包。
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
