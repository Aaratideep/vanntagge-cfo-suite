import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  allowedDevOrigins: ['vanntagge-cfo.loca.lt'],
  typescript: {
    ignoreBuildErrors: false,
  },
} as any;

export default nextConfig;
