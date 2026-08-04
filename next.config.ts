import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gzip/Brotli compress all responses
  compress: true,
  // Remove X-Powered-By header (minor security + fewer bytes)
  poweredByHeader: false,
  // Serve modern image formats
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Strip console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
