import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  allowedDevOrigins: ['vanntagge-cfo.loca.lt'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
} as any;

export default nextConfig;
