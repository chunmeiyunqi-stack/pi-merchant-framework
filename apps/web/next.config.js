/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pi-merchant/pi-sdk', '@pi-merchant/config', '@pi-merchant/types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  // Pi Network 闇€瑕佸湪鐗瑰畾鍩熷悕涓嬭繍琛岋紝杩欓噷閰嶇疆 CORS 浠ユ敮鎸佹湰鍦板紑鍙?  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL ?? '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
