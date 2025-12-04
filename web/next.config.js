/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export', // Enable static HTML export
  images: {
    unoptimized: true, // Required for static export
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip linting during production build
  },
  typescript: {
    ignoreBuildErrors: true, // Skip type checking during production build (temporary)
  },
};

module.exports = nextConfig;
