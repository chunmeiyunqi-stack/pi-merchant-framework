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
// - NEXT_PUBLIC_PI_SANDBOX 显式 "true" → 沙盒；显式 "false" → 主网
// - 未设置时：本地开发(NODE_ENV!==production)走沙盒，生产(Vercel)默认走主网
//   （否则部署在 Vercel 上用沙盒 accessToken 去验证主网 /v2/me 会 401 → “服务端身份校验失败”）
const PI_SANDBOX =
  process.env.NEXT_PUBLIC_PI_SANDBOX !== undefined
    ? process.env.NEXT_PUBLIC_PI_SANDBOX === 'true'
    : process.env.NODE_ENV !== 'production';

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
