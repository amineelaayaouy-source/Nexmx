import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product images are served from Shopify's CDN.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
