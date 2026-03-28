// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const baseConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  cacheComponents: true,
};

let config: NextConfig = baseConfig;

if (isProd) {
  // Only wrap with next-pwa for production (webpack build)
  const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: false, // ensure it's ON for production
  });
  config = withPWA(baseConfig);
}

export default config;
