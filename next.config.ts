import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // disabled to allow dynamic routes in build
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side webpack config - exclude server-only packages
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
      
      // Exclude problematic packages from client bundle
      config.externals = config.externals || [];
      config.externals.push('strong-soap', 'globalize', 'cldr');
    }
    
    return config;
  },
};

export default nextConfig;
