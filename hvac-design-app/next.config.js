const path = require('path');

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export is opt-in to avoid blocking dynamic routes during normal builds/CI
  output: isStaticExport ? 'export' : undefined,

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
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
