/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pi-merchant/types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // standalone 输出仅在 CI/Docker 环境中启用，规避 Windows pnpm symlink EPERM 问题。
  // 本地开发（Windows）使用默认输出模式，Docker/Linux 构建会自动获得 standalone 产物。
  output: process.env.DOCKER_BUILD || (process.env.CI && !process.env.VERCEL) ? 'standalone' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
