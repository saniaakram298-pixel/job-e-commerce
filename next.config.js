const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: false, // یہاں 'true' کی جگہ 'false' کر دیں
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  staticPageGenerationTimeout: 300, 
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.googleapis.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false, 
    minimumCacheTTL: 31536000,
  },
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = withBundleAnalyzer(nextConfig);