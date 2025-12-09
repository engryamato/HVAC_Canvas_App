/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Tauri: use static export in production, but not in development
  // This allows dynamic routes during development while still supporting Tauri build
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true, // Required for static export
  },
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
