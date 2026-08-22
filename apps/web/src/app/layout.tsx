import Script from 'next/script';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import EnvBanner from '@/components/EnvBanner';

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
  themeColor: '#07030E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// 沙盒/主网判定：
// - 生产环境（Vercel）永远走主网（沙盒仅用于本地 localhost + sandbox browser，
//   部署在 Vercel 上若误配 NEXT_PUBLIC_PI_SANDBOX=true 会造成“沙盒支付单 vs 主网审批”不匹配而超时）
// - 本地开发默认走沙盒，除非显式 NEXT_PUBLIC_PI_SANDBOX=false
const PI_SANDBOX =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen font-sans antialiased">
        {/*
          Pi SDK 官方标准初始化（Pi Developer Docs）：
            <script src="https://sdk.minepi.com/pi-sdk.js"></script>
            <script>Pi.init({ version: "2.0" })</script>

          App Router 下必须用 next/script（beforeInteractive），
          因为 <script dangerouslySetInnerHTML> 内联脚本不会被 React 执行。

          Pi.init() 返回 Promise，这里把 Promise 存到 window.__piInitPromise，
          供客户端在调用 Pi.createPayment 前 await，避免 “SDK 未初始化” 竞态。
        */}
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
        <Script id="pi-sdk-init" strategy="beforeInteractive">
          {`window.__piInitPromise = (function () {
            if (typeof window === 'undefined' || !window.Pi) return Promise.resolve();
            return window.Pi.init({ version: "2.0", sandbox: ${PI_SANDBOX} });
          })();`}
        </Script>
        <EnvBanner />
        {children}
      </body>
    </html>
  );
}
