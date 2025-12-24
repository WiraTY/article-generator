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
};

export default nextConfig;
