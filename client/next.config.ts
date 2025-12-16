import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'agribegri.com',
      },
      {
        protocol: 'https',
        hostname: 'dujjhct8zer0r.cloudfront.net',
      },
    ],
  },
  // Exclude backend folder from webpack build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    // Ignore backend folder
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/backend/**', '**/node_modules/**'],
    };
    return config;
  },
  // Turbopack configuration for Next.js 16
  // Empty config to silence the warning about webpack/turbopack conflict
  turbopack: {},
};

export default nextConfig;
