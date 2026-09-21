// Serves the static Home Safety Solutions site (in /public) through Next.js.
// Clean URLs (/about -> /public/about.html) are handled by the rewrites below,
// mirroring the original vercel.json "cleanUrls" behavior. Security and
// caching headers replace the original vercel.json "headers" block.

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/data/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/forms/:path*", headers: [{ key: "Content-Disposition", value: "attachment" }] },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      // Runs only for paths not matched by a public file or a route handler,
      // so real assets (/assets/..., /data/..., /api/...) are untouched.
      // Single-segment: every page HTML file lives at the top level of /public.
      afterFiles: [{ source: "/:path", destination: "/:path.html" }],
    }
  },
}

export default nextConfig
