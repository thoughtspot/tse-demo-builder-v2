import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    SPOTGPT_API_KEY: process.env.SPOTGPT_API_KEY,
  },
};

export default nextConfig;
