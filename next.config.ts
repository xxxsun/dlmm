import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow realtime SSE to stream
  experimental: {
  },
  // Ensure API routes handle dynamic rendering
  // Security: never expose RPC keys to client; only NEXT_PUBLIC_ vars are client-safe
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
