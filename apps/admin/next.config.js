/** @type {import('next').NextConfig} */
// Standalone output for CI/Docker builds only; local Dev uses default mode (avoids WGS symlink EPERM)
const nextConfig = {
  transpilePackages: ['@pi-merchant/types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  output: process.env.DOCKER_BUILD || (process.env.CI && !process.env.VERCEL) ? 'standalone' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

