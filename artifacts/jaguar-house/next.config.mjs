/** @type {import('next').NextConfig} */
const apiOriginValue = process.env.JAGUAR_API_ORIGIN;
let apiOrigin = null;

if (apiOriginValue) {
  let parsedApiOrigin;
  try {
    parsedApiOrigin = new URL(apiOriginValue);
  } catch {
    throw new Error("JAGUAR_API_ORIGIN must be a valid HTTPS origin");
  }
  if (
    parsedApiOrigin.protocol !== "https:" ||
    parsedApiOrigin.username ||
    parsedApiOrigin.password ||
    parsedApiOrigin.pathname !== "/" ||
    parsedApiOrigin.search ||
    parsedApiOrigin.hash
  ) {
    throw new Error("JAGUAR_API_ORIGIN must be an HTTPS origin without a path");
  }
  apiOrigin = parsedApiOrigin.origin;
}

const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  transpilePackages: ["@workspace/api-client-react", "@workspace/jaguar-spk-design-system"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  allowedDevOrigins: [
    "*.replit.dev",
    "*.replit.app",
    "localhost",
    "127.0.0.1",
    ...(process.env.REPLIT_DEV_DOMAIN ? [process.env.REPLIT_DEV_DOMAIN] : []),
  ],
  experimental: {
    cpus: 2,
    optimizePackageImports: ["lucide-react", "@workspace/jaguar-spk-design-system"],
  },
  async rewrites() {
    if (!apiOrigin) return [];
    return [{
      source: "/api/:path*",
      destination: `${apiOrigin}/api/:path*`,
    }];
  },
  async headers() {
    return [
      {
        source: "/(brand|ui)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
