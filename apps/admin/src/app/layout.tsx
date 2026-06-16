import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: '先锋人工智能服务框架 - 商户管理后台',
  description: 'Pioneer AI Merchant Framework Admin Console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-indigo-200">
                P
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">先锋人工智能</h1>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  Admin Console
                </p>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {[
                { label: '数据大盘', href: '/dashboard', icon: '📊' },
                { label: '订单管理', href: '/orders', icon: '📋' },
                { label: '支付流水', href: '/payments', icon: '💸' },
                { label: '商户配置', href: '/settings', icon: '⚙️' },
                { label: '授权管理', href: '/monitoring', icon: '🛡️' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  <span className="text-lg opacity-70">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">
                  License Status
                </p>
                <p className="text-xs font-semibold text-indigo-900 mb-2">商业专业版 V2.0.0</p>
                <div className="w-full h-1 bg-indigo-200 rounded-full overflow-hidden">
                  <div className="w-4/5 h-full bg-indigo-600" />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 ml-64 p-8">
            <header className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>控制台</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">当前页面</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                  商
                </div>
              </div>
            </header>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
