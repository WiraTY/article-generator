import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warnings won't fail the build on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking during build (already done in CI/local)
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
    ],
  },
};

export default nextConfig;
