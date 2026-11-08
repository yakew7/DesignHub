export const siteConfig = {
  name: "DesignHub",
  tagline: "Stop opening 15 design websites. Open one.",
  description:
    "An open-source, local-first design and brand identity toolkit. Typography, colors, icons and design tokens in one place.",
  /** Public URL of this deployment, for canonical links, the sitemap and social previews. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://designhub.dev").replace(/\/+$/, ""),
  github: "https://github.com/yakew7/DesignHub",
  version: "1.2.0",
} as const;
