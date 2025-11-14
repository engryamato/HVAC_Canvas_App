/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // CRITICAL for Tauri - enables static export
  images: {
    unoptimized: true // Required for static export
  },
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  }
}

module.exports = nextConfig

