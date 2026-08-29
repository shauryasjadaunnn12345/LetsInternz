import type { NextConfig } from "next";

const API_ORIGIN = process.env.BACKEND_API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Django/DRF routes are registered with trailing slashes (e.g.
  // /api/internships/), and Next.js's default trailing-slash redirect runs
  // *before* rewrites — without this, every proxied API call would get
  // redirected to the no-trailing-slash form first, then 404 against
  // Django. This keeps the URL exactly as requested through to the rewrite.
  skipTrailingSlashRedirect: true,

  async rewrites() {
    return [
      // Django/DRF routes always end in a trailing slash. Next's `:path*`
      // wildcard silently drops a trailing slash from the matched request
      // (a documented quirk), so it's matched explicitly here rather than
      // relying on the wildcard to carry it through.
      {
        source: "/api/:path*/",
        destination: `${API_ORIGIN}/api/:path*/`,
      },
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*/`,
      },
      {
        source: "/media/:path*",
        destination: `${API_ORIGIN}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
