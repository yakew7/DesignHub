import { lines, logo, mockupDoc, onPrimaryLarge, text, textWidth, truncate } from "@/lib/mockups/kit";
import { glowBackdrop, gradientBackdrop, heading, lockup, pill, share } from "@/lib/social/templates/shared";
import type { SocialContext, SocialTemplate } from "@/lib/social/types";

const W = 1200;
const H = 630;
// Link previews in chat apps often crop OG images to a centred square or 1.91:1 strip.
const safe = { x: 60, y: 40, width: W - 120, height: H - 80 };

function article(ctx: SocialContext): string {
  const { surface, content } = ctx;
  const pad = 80;
  const title = heading(ctx, content.headline, pad, 250, W - pad * 2, 68, surface.text, { maxLines: 3 });
  const [siteMax, handleMax] = share(
    textWidth(ctx, content.website, 24, "bb"),
    textWidth(ctx, content.handle, 24),
    W - pad * 2 - 48,
  );
  return `${glowBackdrop(ctx, W, H, 42)}
    <rect width="${W}" height="10" fill="${surface.primary}"/>
    ${lockup(ctx, pad, 120, 44, undefined, "og-a", W - pad * 2)}
    ${title.markup}
    ${text(pad, title.bottom + 60, content.subtitle, { size: 28, fill: surface.muted })}
    <rect x="${pad}" y="${H - 116}" width="${W - pad * 2}" height="1.5" fill="${surface.border}"/>
    ${text(pad, H - 64, truncate(ctx, content.website, siteMax, 24, "bb"), { size: 24, fill: surface.primary, font: "bb" })}
    ${text(W - pad, H - 64, truncate(ctx, content.handle, handleMax, 24), { size: 24, fill: surface.muted, anchor: "end" })}`;
}

function product(ctx: SocialContext): string {
  const { surface, content, brand } = ctx;
  const on = onPrimaryLarge(ctx);
  const pad = 72;
  const r = Math.min(brand.radius, 18);
  const title = heading(ctx, content.headline, pad, 260, 500, 58, on, { maxLines: 4 });
  const cta = content.cta.trim()
    ? pill(ctx, pad, title.bottom + 56, content.cta, 22, { fill: on, text: surface.primary }).markup
    : "";
  const cardX = 640;
  const card = `<g filter="url(#soft)"><rect x="${cardX}" y="110" width="${W - cardX + 40}" height="${H - 60}" rx="${r + 6}" fill="${surface.background}"/></g>
    <rect x="${cardX}" y="110" width="${W - cardX + 40}" height="52" rx="${r + 6}" fill="${surface.surface}"/>
    <rect x="${cardX}" y="140" width="${W - cardX + 40}" height="22" fill="${surface.surface}"/>
    <circle cx="${cardX + 28}" cy="136" r="7" fill="#ff5f57"/><circle cx="${cardX + 50}" cy="136" r="7" fill="#febc2e"/><circle cx="${cardX + 72}" cy="136" r="7" fill="#28c840"/>
    ${logo(ctx, { x: cardX + 40, y: 196, width: 40, height: 40 }, undefined, "og-p")}
    ${text(cardX + 96, 226, truncate(ctx, brand.name, W - 60 - cardX - 96, 24, "h"), { size: 24, fill: surface.text, font: "h" })}
    ${lines(cardX + 40, 272, 460, 3, 28, surface.border)}
    <rect x="${cardX + 40}" y="370" width="220" height="140" rx="${r}" fill="${surface.primary}" fill-opacity=".14"/>
    <rect x="${cardX + 280}" y="370" width="220" height="140" rx="${r}" fill="${surface.secondary}" fill-opacity=".14"/>
    <rect x="${cardX + 60}" y="470" width="80" height="16" rx="8" fill="${surface.primary}"/>`;
  return `${gradientBackdrop(ctx, W, H)}
    ${lockup(ctx, pad, 120, 40, on, "og-pl", cardX - 40 - pad)}
    ${title.markup}
    ${cta}
    ${card}`;
}

function minimal(ctx: SocialContext): string {
  const { surface, content, brand } = ctx;
  return `${glowBackdrop(ctx, W, H, 42)}
    ${logo(ctx, { x: W / 2 - 80, y: 140, width: 160, height: 160 }, undefined, "og-m")}
    ${text(W / 2, 390, truncate(ctx, brand.name, W - 160, 76, "h"), { size: 76, fill: surface.text, font: "h", anchor: "middle" })}
    ${text(W / 2, 450, content.subtitle, { size: 28, fill: surface.muted, anchor: "middle" })}
    ${text(W / 2, H - 60, truncate(ctx, content.website, W - 160, 22, "bb"), { size: 22, fill: surface.primaryText, font: "bb", anchor: "middle" })}`;
}

function og(id: string, label: string, description: string, draw: (ctx: SocialContext) => string): SocialTemplate {
  return {
    id,
    platform: "Open Graph",
    label,
    width: W,
    height: H,
    description,
    safe,
    render: (ctx) => mockupDoc(ctx, W, H, draw(ctx)),
  };
}

export const ogTemplates: SocialTemplate[] = [
  og("og-article", "Article", "Blog posts and docs pages: headline, subtitle and site.", article),
  og("og-product", "Product", "Landing pages: headline, call to action and a product frame.", product),
  og("og-minimal", "Minimal", "Home page: centred logo and name.", minimal),
];

/** The tags that make a page use this image, for pasting into <head>. */
export function ogMetaTags(ctx: SocialContext, file: string): string {
  const url = `https://${ctx.content.website.replace(/^https?:\/\//, "")}`;
  const title = ctx.brand.name;
  const description = ctx.content.headline;
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return [
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    `<meta property="og:image" content="${escape(`${url}/${file}`)}" />`,
    `<meta property="og:image:width" content="${W}" />`,
    `<meta property="og:image:height" content="${H}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join("\n");
}
