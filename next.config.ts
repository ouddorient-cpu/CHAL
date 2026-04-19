import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_TARGET === 'static' ? 'export' : 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
