import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // disabled to allow dynamic routes in build
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true }, 
};

export default nextConfig;