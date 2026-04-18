import './globals.css';
import type { Metadata } from 'next';
import EnvBanner from '@/components/EnvBanner';

export const metadata: Metadata = {
  // 对外合规展示名
  title: 'Pioneer AI Service Framework',
  description: '赋能千万先锋的智能服务引擎与可复用业务平台基建。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script src="https://sdk.minepi.com/pi-sdk.js" defer></script>
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                if (typeof window !== 'undefined' && window.Pi) {
                  window.Pi.init({ version: "2.0", sandbox: true });
                }
              });
            `
          }}
        />
      </head>
      <body className="bg-gray-50 min-h-screen text-gray-900 font-sans flex flex-col">
        <EnvBanner />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
