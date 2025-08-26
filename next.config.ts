import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // GEEN output: 'export' - want we willen API routes behouden
  
  // Images configuratie
  images: { 
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com', 'storage.googleapis.com']
  },
  
  // Build configuratie
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    ignoreBuildErrors: true
  },
  
  // Webpack configuratie
  webpack: (config, { isServer }) => {
    if (!isServer) {
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
      
      config.externals = config.externals || [];
      config.externals.push('strong-soap', 'globalize', 'cldr');
    }
    
    return config;
  }
};

export default nextConfig;