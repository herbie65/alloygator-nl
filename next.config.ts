import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // enabled for Firebase hosting
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  // trailingSlash: true, // Temporarily disabled for API routes
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
