const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 仅在 Docker / CI（非 Vercel）开启 standalone，避免 Windows 本地 EPERM 与 Vercel 路由组 ENOENT
  output:
    process.env.DOCKER_BUILD === '1' || (process.env.CI === 'true' && !process.env.VERCEL)
      ? 'standalone'
      : undefined,

  // 关键：让 tracing 从 monorepo 根开始，共享包才能被正确打包进 standalone
  outputFileTracingRoot: path.join(__dirname, '../..'),

  transpilePackages: [
    '@pi-merchant/ui',
    '@pi-merchant/pi-sdk',
    '@pi-merchant/types',
    '@pi-merchant/config',
  ],

  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
