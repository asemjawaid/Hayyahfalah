import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@hayyafalah/prayer-engine'],
  turbopack: {},
};

export default nextConfig;
