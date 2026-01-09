const path = require('node:path');

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export is opt-in to avoid blocking dynamic routes during normal builds/CI
  // Standalone output is preferred for Docker
  output: isStaticExport ? 'export' : 'standalone',

  // Silence Next.js workspace root warning about multiple lockfiles
  outputFileTracingRoot: path.join(__dirname, '../'),

  images: {
    // Only disable image optimization when performing a static export
    unoptimized: isStaticExport,
  },
  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Handle Tauri-specific modules that aren't available in web builds
  webpack: (config, { isServer }) => {
    // Externalize Tauri modules that may not exist in web context
    // These are dynamically imported and guarded by isTauri() checks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@tauri-apps/api/fs': false,
      '@tauri-apps/api/path': false,
      '@tauri-apps/plugin-fs': false,
    };
    return config;
  },
};

module.exports = nextConfig;
