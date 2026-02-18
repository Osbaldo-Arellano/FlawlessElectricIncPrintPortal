import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/order": ["./node_modules/@sparticuz/chromium/**"],
    "/api/render-pdf": ["./node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
