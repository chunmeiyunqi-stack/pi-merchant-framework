import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pi Merchant App',
  description: 'Pi Network Merchant Application Workspace',
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
      <body className="bg-gray-50 min-h-screen text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
