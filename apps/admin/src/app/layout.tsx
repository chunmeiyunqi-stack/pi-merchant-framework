import './globals.css';

export const metadata = {
  title: '先锋人工智能服务框架 - 商户管理后台',
  description: 'Pioneer AI Merchant Framework Admin Console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-900 text-gray-100 antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
