/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pi-merchant/pi-sdk', '@pi-merchant/config', '@pi-merchant/types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Pi Network 需要在特定域名下运行，这里配置 CORS 以支持本地开发
  async headers() {
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
