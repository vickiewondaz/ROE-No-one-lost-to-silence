import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ROE alpha: classic prerender for demo speed; re-enable cacheComponents with Suspense before pilot hardening */
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
