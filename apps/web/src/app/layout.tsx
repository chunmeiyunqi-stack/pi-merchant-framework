import './globals.css';
import type { Metadata, Viewport } from 'next';
import EnvBanner from '@/components/EnvBanner';
import FooterLegal from '@/components/FooterLegal';

export const metadata: Metadata = {
  title: 'Pioneer AI Service Framework',
  description: '赋能千万先锋的智能服务引擎与可复用业务平台基建。',
  applicationName: 'Pioneer AI Service Framework',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Pioneer AI Service Framework',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/*
          Pi SDK 官方标准初始化（来自 Pi Developer Docs）:
            <script src="https://sdk.minepi.com/pi-sdk.js"></script>
            <script>Pi.init({ version: "2.0" })</script>
          两个顺序 <script>，Pi Browser 保证同步执行，无需 defer / load 事件
        */}
        {/* eslint-disable-next-line */}
        <script src="https://sdk.minepi.com/pi-sdk.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `Pi.init({ version: "2.0", sandbox: true });`,
          }}
        />
      </head>
      <body className="bg-gray-50 min-h-screen text-gray-900 font-sans flex flex-col">
        <EnvBanner />
        <div className="flex-1 flex flex-col">{children}</div>
        <FooterLegal />
      </body>
    </html>
  );
}

