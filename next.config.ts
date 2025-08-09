const nextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      { source: '/agadmin', destination: '/admin' },
      { source: '/agadmin/:path*', destination: '/admin/:path*' },
    ]
  },
};

export default nextConfig;