const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export is opt-in to avoid blocking dynamic routes during normal builds/CI
  output: isStaticExport ? 'export' : undefined,
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
