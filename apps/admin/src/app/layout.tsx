import './globals.css';

export const metadata = {
  title: '先锋人工智能服务框架 - 商户管理后台',
  description: 'Pioneer AI Merchant Framework Admin Console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
