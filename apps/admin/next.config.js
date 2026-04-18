/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pi-merchant/types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

module.exports = nextConfig;
