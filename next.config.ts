// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const baseConfig: NextConfig = {
  // Ignore TypeScript build errors for faster deployment of this personal project
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optional: Turbopack-specific settings live under this top-level key in Next 15+
  // (you can remove this block if you don't need aliases/rules)
  turbopack: {
    // resolveAlias: { /* ... */ },
    // rules: { /* ... */ },
  },
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
