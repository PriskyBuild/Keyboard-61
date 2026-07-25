import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Allow the preview/chat origins to load _next resources during local dev.
  allowedDevOrigins: [
    "*.space-z.ai",
    "space-z.ai",
    "localhost",
    "127.0.0.1",
  ],
  // Speed up deployment: compress responses + cache headers for static assets.
  compress: true,
  // Optimize package imports — reduces bundle size + speeds up initial load.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "cmdk",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },
  // Add long-cache headers for static assets served from /public.
  async headers() {
    return [
      {
        source: "/worklets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/stickers/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
