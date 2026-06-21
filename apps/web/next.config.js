/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pi-merchant/pi-sdk', '@pi-merchant/config', '@pi-merchant/types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  output: (process.env.DOCKER_BUILD || (process.env.CI && !process.env.VERCEL)) ? 'standalone' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
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