import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Allow the preview/chat origins to load _next resources during local dev.
  // Purely cosmetic; does not affect production. Vercel ignores this field.
  allowedDevOrigins: [
    "*.space-z.ai",
    "space-z.ai",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
