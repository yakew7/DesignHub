import type { NextConfig } from "next";

import { buildContentSecurityPolicy } from "./lib/csp";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

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
      process.env.NODE_ENV === "production"
        ? [{ key: "Content-Security-Policy", value: buildContentSecurityPolicy(process.env.DESIGNHUB_CSP_CONNECT) }]
        : [];
    return [{ source: "/:path*", headers: [...securityHeaders, ...policy] }];
  },
};

export default nextConfig;
