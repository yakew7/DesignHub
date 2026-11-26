/**
 * The Content-Security-Policy of a production build (next.config.ts). The app has no server and loads little from
 * elsewhere:
 * - scripts and styles are its own, with inline ones that Next.js and React style props need (a static page cannot
 *   carry a per-request nonce, so 'unsafe-inline' stays in this header for these two and everything else is closed;
 *   scripts are closed again by the page's own policy with hashes, scripts/csp-hashes.mjs);
 * - Google Fonts (the stylesheet and the font files) and the Iconify hosts for icon search;
 * - the AI provider the person chooses in Brand DNA, which may be any https host or a server on this machine, so
 *   `connect-src` allows https and localhost by default;
 * - blob: for the module worker and for files made in the page, data: for the SVG images it renders.
 * It is not sent in development, where React's refresh needs eval.
 *
 * A copy that does not use the AI provider can narrow `connect-src` with `DESIGNHUB_CSP_CONNECT` at build time: a
 * space separated list of sources (`https://api.iconify.design https://api.simplesvg.com`) that replaces the default
 * after 'self' (docs/self-hosting.md).
 */
export const defaultConnectSources = "https: http://localhost:* http://127.0.0.1:*";

/**
 * The sources of a `DESIGNHUB_CSP_CONNECT` value. Every one must be a plain source expression (a scheme, a host, a
 * port, a wildcard); a value with a quote, a semicolon or anything else is refused as a whole, so it cannot add a
 * keyword or a directive, and the default stays.
 */
export function connectSources(value: string | undefined): string {
  const sources = (value ?? "").split(/\s+/).filter(Boolean);
  const plain = sources.every((source) => /^[A-Za-z0-9:/.*_\-\[\]]+$/.test(source) && source !== "*");
  return sources.length > 0 && plain ? sources.join(" ") : defaultConnectSources;
}

export function buildContentSecurityPolicy(connect?: string): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${connectSources(connect)}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
}
