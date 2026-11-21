import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

/**
 * The Content-Security-Policy of a production build. The app has no server and loads little from elsewhere:
 * - scripts and styles are its own, with inline ones that Next.js and React style props need (a static page cannot
 *   carry a per-request nonce, so 'unsafe-inline' stays for these two and everything else is closed);
 * - Google Fonts (the stylesheet and the font files) and the Iconify hosts for icon search;
 * - the AI provider the person chooses in Brand DNA, which may be any https host or a server on this machine, so
 *   `connect-src` allows https and localhost (a self-hosted copy can narrow it, see docs/self-hosting.md);
 * - blob: for the module worker and for files made in the page, data: for the SVG images it renders.
 * It is not sent in development, where React's refresh needs eval.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // AGENTS.md is maintained by hand (see its "Next.js 16" section); don't let `next dev` rewrite it.
  agentRules: false,
  // Paper.js only runs in the browser; keep its Node-only code paths (jsdom, canvas) out of the server bundle.
  serverExternalPackages: ["paper"],
  experimental: {
    // Barrel-style packages: import only what each route uses.
    optimizePackageImports: ["radix-ui", "lucide-react", "framer-motion", "@iconify/utils"],
  },
  async headers() {
    const policy =
      process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }] : [];
    return [{ source: "/:path*", headers: [...securityHeaders, ...policy] }];
  },
};

export default nextConfig;
