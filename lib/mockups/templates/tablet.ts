import { lines, logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { dashboard } from "@/lib/mockups/templates/desktop-dashboard";
import { studio, tablet } from "@/lib/mockups/templates/devices";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

// The landscape tablet shows the desktop dashboard scaled to its display.
const DASH_W = 1600;
const DASH_H = 1000;
const LAND_W = 1440;
const LAND_H = 900;

// The portrait tablet shows the landing page's narrow layout at 800 × 1280 points.
const PAGE_W = 800;
const PAGE_H = 1280;
const PORT_W = 560;
const PORT_H = 896;

/** The landing page as it reflows on a narrow screen: one column, a menu button and stacked cards. */
export function landingMobile(ctx: MockupContext, width: number, height: number): string {
  const { surface, content, brand } = ctx;
  const onPrimary = onPrimaryLarge(ctx);
  const r = Math.min(brand.radius, 20);
  const pad = 56;
  const inner = width - pad * 2;

  const menu = [0, 1, 2]
    .map(
      (i) => `<rect x="${width - pad - 32}" y="${46 + i * 11}" width="32" height="3" rx="1.5" fill="${surface.text}"/>`,
    )
    .join("");
  const name = truncate(ctx, brand.name, inner - 50 - 72, 24, "h");

  const eyebrow = truncate(ctx, `NEW  ·  ${brand.name.toUpperCase()} 2.0`, inner, 16, "bb", 3);
  const size = 64;
  const headline = wrap(ctx, content.headline, inner, size, "h", 3);
  const heroTop = 260;
  const title = headline
    .map((line, i) => text(pad, heroTop + i * size * 1.1, line, { size, fill: surface.text, font: "h" }))
    .join("");
  const afterTitle = heroTop + (headline.length - 1) * size * 1.1 + 64;
  const sub = wrap(
    ctx,
    `${brand.name} helps teams move from idea to launch with one consistent system.`,
    inner,
    24,
    "b",
    3,
  );
  const subText = sub
    .map((line, i) => text(pad, afterTitle + i * 36, line, { size: 24, fill: surface.muted }))
    .join("");

  // Two buttons share the width.
  const btnY = afterTitle + (sub.length - 1) * 36 + 44;
  const btnW = (inner - 20) / 2;
  const cta = truncate(ctx, content.cta || "Get started", btnW - 40, 21, "bb");
  const buttons = `<rect x="${pad}" y="${btnY}" width="${btnW}" height="64" rx="${Math.min(r, 32)}" fill="${surface.primary}"/>
    ${text(pad + btnW / 2, btnY + 40, cta, { size: 21, fill: onPrimary, font: "bb", anchor: "middle" })}
    <rect x="${pad + btnW + 20}" y="${btnY}" width="${btnW}" height="64" rx="${Math.min(r, 32)}" fill="none" stroke="${surface.border}" stroke-width="2"/>
    ${text(pad + btnW * 1.5 + 20, btnY + 40, "Learn more", { size: 21, fill: surface.text, font: "bb", anchor: "middle" })}`;

  const cardY = btnY + 112;
  const cardH = 340;
  const hero = `<rect x="${pad}" y="${cardY}" width="${inner}" height="${cardH}" rx="${r + 6}" fill="url(#tm-hero)"/>
    <rect x="${pad + 36}" y="${cardY + 40}" width="${inner - 72}" height="${cardH - 80}" rx="${r}" fill="${surface.background}" fill-opacity=".94"/>
    ${logo(ctx, { x: pad + 68, y: cardY + 72, width: 44, height: 44 }, undefined, "tm-card")}
    ${text(pad + 128, cardY + 103, truncate(ctx, brand.name, inner - 200, 22, "h"), { size: 22, fill: surface.text, font: "h" })}
    ${lines(pad + 68, cardY + 150, inner - 136, 2, 26, surface.border)}
    <rect x="${pad + 68}" y="${cardY + 214}" width="${(inner - 152) / 2}" height="56" rx="${r}" fill="${surface.secondary}" fill-opacity=".14"/>
    <rect x="${pad + 84 + (inner - 152) / 2}" y="${cardY + 214}" width="${(inner - 152) / 2}" height="56" rx="${r}" fill="${surface.primary}" fill-opacity=".14"/>`;

  // Feature cards stack in one column and run past the fold, like a page that scrolls.
  const features = ["Consistent", "Accessible", "Local first"];
  const featureCards = features
    .map((label, i) => {
      const y = cardY + cardH + 40 + i * 156;
      const color = i === 1 ? surface.secondary : surface.primary;
      return `<rect x="${pad}" y="${y}" width="${inner}" height="132" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
        <rect x="${pad + 28}" y="${y + 28}" width="52" height="52" rx="${Math.min(r, 12)}" fill="${color}" fill-opacity=".16"/>
        <circle cx="${pad + 54}" cy="${y + 54}" r="9" fill="${color}"/>
        ${text(pad + 104, y + 54, label, { size: 24, fill: surface.text, font: "h" })}
        ${lines(pad + 104, y + 74, inner - 140, 2, 24, surface.border)}`;
    })
    .join("");

  return `<defs><linearGradient id="tm-hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient></defs>
    <rect width="${width}" height="${height}" fill="${surface.background}"/>
    ${logo(ctx, { x: pad, y: 40, width: 36, height: 36 }, undefined, "tm-nav")}
    ${text(pad + 50, 67, name, { size: 24, fill: surface.text, font: "h" })}
    ${menu}
    <rect y="112" width="${width}" height="1" fill="${surface.border}"/>
    ${text(pad, 190, eyebrow, { size: 16, fill: surface.primaryText, font: "bb", spacing: 3 })}
    ${title}
    ${subText}
    ${buttons}
    ${hero}
    ${featureCards}`;
}

export const tabletScreens: MockupTemplate = {
  id: "tablet",
  label: "Tablet",
  category: "Screens",
  description: "Dashboard on a landscape tablet beside the mobile layout on a portrait one.",
  render(ctx) {
    const width = 2400;
    const height = 1300;
    const bezel = 26;
    const gap = 72;
    const landW = LAND_W + bezel * 2;
    const portW = PORT_W + bezel * 2;
    const x0 = (width - (landW + gap + portW)) / 2;
    const landY = (height - (LAND_H + bezel * 2)) / 2;
    const portY = (height - (PORT_H + bezel * 2)) / 2;
    return mockupDoc(
      ctx,
      width,
      height,
      `${studio(ctx, width, height)}
      ${tablet(x0, landY, LAND_W, LAND_H, dashboard(ctx, DASH_W, DASH_H), DASH_W, DASH_H)}
      ${tablet(x0 + landW + gap, portY, PORT_W, PORT_H, landingMobile(ctx, PAGE_W, PAGE_H), PAGE_W, PAGE_H)}`,
    );
  },
};
