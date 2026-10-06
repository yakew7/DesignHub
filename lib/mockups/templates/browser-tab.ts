import { nestLogo } from "@/lib/logo/compose";
import { renderVariant, variantContext } from "@/lib/logo/variants";
import { mockupDoc, text, truncate } from "@/lib/mockups/kit";
import { screen, studio } from "@/lib/mockups/templates/devices";
import { landingPage } from "@/lib/mockups/templates/laptop-landing";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const W = 1600;
const H = 1400;
const SW = 1440;
const SH = 900;
const STRIP = 46;
const TOOLBAR = 50;
const TAB = 240;
/** Real favicon size, in CSS pixels. */
const FAVICON = 16;

type Chrome = { strip: string; tab: string; field: string; text: string; muted: string; glyph: string };

/** Browser chrome colors: neutral device colors, light by day and dark at night. */
function chrome(dark: boolean): Chrome {
  return dark
    ? { strip: "#1f2023", tab: "#35363a", field: "#202124", text: "#e8eaed", muted: "#9aa0a6", glyph: "#5f6368" }
    : { strip: "#dee1e6", tab: "#ffffff", field: "#f1f3f4", text: "#202124", muted: "#5f6368", glyph: "#9aa0a6" };
}

/** One tab at the local origin. The active tab joins the toolbar with flared bottom corners. */
function tab(ctx: MockupContext, c: Chrome, title: string, icon: string, active: boolean): string {
  const h = STRIP - 8;
  const r = 10;
  const shape = active
    ? `<path d="M${-r} ${h} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 H${TAB - r} Q${TAB} 0 ${TAB} ${r} V${h - r} Q${TAB} ${h} ${TAB + r} ${h} Z" fill="${c.tab}"/>`
    : `<path d="M${TAB} ${10} V${h - 10}" stroke="${c.glyph}" stroke-opacity=".6" stroke-width="1"/>`;
  return `${shape}
    ${icon}
    ${text(40, 24, truncate(ctx, title, TAB - 40 - 34, 13), { size: 13, fill: active ? c.text : c.muted })}
    <path d="M${TAB - 24} 15 l8 8 m0 -8 l-8 8" stroke="${active ? c.text : c.muted}" stroke-width="1.4" stroke-linecap="round"/>`;
}

/** A generic favicon for the other tabs, drawn in the chrome's neutral glyph color. */
function genericIcon(c: Chrome, kind: number): string {
  const x = 14;
  const y = 11;
  const shapes = [
    `<rect x="${x}" y="${y + 2}" width="16" height="12" rx="2" fill="none" stroke="${c.muted}" stroke-width="1.6"/><path d="M${x} ${y + 3} l8 6 l8 -6" fill="none" stroke="${c.muted}" stroke-width="1.6"/>`,
    `<rect x="${x + 2}" y="${y}" width="12" height="16" rx="2" fill="${c.muted}"/><path d="M${x + 5} ${y + 6} h6 M${x + 5} ${y + 10} h6" stroke="${c.tab}" stroke-width="1.4"/>`,
    `<circle cx="${x + 8}" cy="${y + 8}" r="7.5" fill="none" stroke="${c.muted}" stroke-width="1.6"/><path d="M${x + 8} ${y + 4} v4 l3 2" fill="none" stroke="${c.muted}" stroke-width="1.6" stroke-linecap="round"/>`,
  ];
  return shapes[kind % shapes.length]!;
}

export const browserTab: MockupTemplate = {
  id: "browser-tab",
  label: "Browser tab",
  category: "Screens",
  description: "The favicon and page title in a browser tab, with a 16 px and 2x callout, above the landing page.",
  render(ctx) {
    const { surface, brand, content, mode } = ctx;
    const dark = mode === "dark";
    const c = chrome(dark);
    // The favicon is the app icon variant, exactly as the logo pack exports it.
    const { heading, headingWeight } = brand.typography;
    const icon = renderVariant(
      "app-icon",
      variantContext(brand, ctx.fontCss, (value, size) => ctx.measure(value, heading, headingWeight, size)),
    );
    const favicon = (x: number, y: number, size: number, id: string) =>
      nestLogo(icon, { x, y, width: size, height: size }, id);
    const title = content.headline.trim() ? `${brand.name} - ${content.headline}` : brand.name;

    const wx = (W - SW) / 2;
    const wy = 360;
    const tabsX = 84;
    const tabs = [
      { title: "Inbox (3)", icon: genericIcon(c, 0) },
      { title, icon: "", active: true },
      { title: "Quarterly planning", icon: genericIcon(c, 1) },
      { title: "Calendar", icon: genericIcon(c, 2) },
    ];
    const activeIndex = 1;
    const tabMarkup = tabs
      .map((item, i) => {
        if (item.active) return "";
        return `<g transform="translate(${tabsX + i * TAB} 8)">${tab(ctx, c, item.title, item.icon, false)}</g>`;
      })
      .join("");
    const activeX = tabsX + activeIndex * TAB;
    const activeTab = `<g transform="translate(${activeX} 8)">${tab(ctx, c, title, favicon(14, 11, FAVICON, "fav-tab"), true)}</g>`;
    const plusX = tabsX + tabs.length * TAB + 22;

    const url = content.website.replace(/^https?:\/\//, "");
    const toolbar = `<rect y="${STRIP}" width="${SW}" height="${TOOLBAR}" fill="${c.tab}"/>
      <path d="M28 ${STRIP + 25} h14 m-14 0 l6 -6 m-6 6 l6 6 M68 ${STRIP + 25} h14 m0 0 l-6 -6 m6 6 l-6 6" fill="none" stroke="${c.text}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M118 ${STRIP + 19} a7 7 0 1 0 3 4 M121 ${STRIP + 16} v6 h-6" fill="none" stroke="${c.text}" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="146" y="${STRIP + 8}" width="${SW - 146 - 90}" height="34" rx="17" fill="${c.field}"/>
      <rect x="166" y="${STRIP + 22}" width="10" height="8" rx="1.5" fill="${c.muted}"/><path d="M168 ${STRIP + 22} v-3 a3 3 0 0 1 6 0 v3" fill="none" stroke="${c.muted}" stroke-width="1.5"/>
      ${text(190, STRIP + 30, url, { size: 15, fill: c.text })}
      <circle cx="${SW - 60}" cy="${STRIP + 25}" r="12" fill="${surface.primary}"/>
      ${text(SW - 60, STRIP + 30, brand.name.slice(0, 1).toUpperCase(), { size: 13, fill: surface.onPrimary, font: "bb", anchor: "middle" })}
      <path d="M${SW - 26} ${STRIP + 18} v0.1 M${SW - 26} ${STRIP + 25} v0.1 M${SW - 26} ${STRIP + 32} v0.1" stroke="${c.text}" stroke-width="3" stroke-linecap="round"/>
      <rect y="${STRIP + TOOLBAR - 1}" width="${SW}" height="1" fill="#000" fill-opacity=".12"/>`;

    const windowBody = `<rect width="${SW}" height="${STRIP + TOOLBAR + SH}" fill="${c.strip}"/>
      <circle cx="24" cy="25" r="6" fill="#ff5f57"/><circle cx="44" cy="25" r="6" fill="#febc2e"/><circle cx="64" cy="25" r="6" fill="#28c840"/>
      ${tabMarkup}
      ${toolbar}
      ${activeTab}
      <path d="M${plusX - 6} 27 h12 M${plusX} 21 v12" stroke="${c.muted}" stroke-width="1.6" stroke-linecap="round"/>
      ${screen(0, STRIP + TOOLBAR, SW, SH, landingPage(ctx, SW, SH))}`;
    const frame = `<g transform="translate(${wx} ${wy})">
      <rect width="${SW}" height="${STRIP + TOOLBAR + SH}" rx="14" fill="${c.strip}" filter="url(#soft)"/>
      <svg width="${SW}" height="${STRIP + TOOLBAR + SH}" viewBox="0 0 ${SW} ${STRIP + TOOLBAR + SH}" overflow="hidden"><clipPath id="bt-window"><rect width="${SW}" height="${STRIP + TOOLBAR + SH}" rx="14"/></clipPath><g clip-path="url(#bt-window)">${windowBody}</g></svg>
    </g>`;

    // Callout above the window: the favicon at real size, then the tab zoomed to 2x.
    const fx = wx + activeX + 14 + FAVICON / 2;
    const fy = wy + 8 + 11 + FAVICON / 2;
    const r = Math.min(brand.radius, 18);
    const cardX = wx + 120;
    const cardY = 60;
    const cardH = 236;
    const tile = 120;
    const zoomX = cardX + 48 + tile + 64;
    const zoomW = TAB * 2 + 40;
    const cardW = zoomX + zoomW + 48 - cardX;
    const tileY = cardY + 40;
    const callout = `<path d="M${fx} ${cardY + cardH} V${fy - 13}" stroke="${surface.primary}" stroke-width="2" stroke-dasharray="6 5"/>
      <circle cx="${fx}" cy="${fy}" r="13" fill="none" stroke="${surface.primary}" stroke-width="2"/>
      <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="${r}" fill="${surface.surface}" stroke="${surface.border}" filter="url(#soft)"/>
      <rect x="${cardX + 48}" y="${tileY}" width="${tile}" height="${tile}" rx="${Math.min(r, 12)}" fill="${c.tab}" stroke="${surface.border}"/>
      ${favicon(cardX + 48 + (tile - FAVICON) / 2, tileY + (tile - FAVICON) / 2, FAVICON, "fav-1x")}
      ${text(cardX + 48, tileY + tile + 40, "16 px", { size: 20, fill: surface.text, font: "bb" })}
      ${text(cardX + 48, tileY + tile + 66, "Actual size", { size: 16, fill: surface.muted })}
      <rect x="${zoomX}" y="${tileY}" width="${zoomW}" height="${tile}" rx="${Math.min(r, 12)}" fill="${c.strip}" stroke="${surface.border}"/>
      <g transform="translate(${zoomX + 20} ${tileY + tile - (STRIP - 8) * 2}) scale(2)">${tab(ctx, c, title, favicon(14, 11, FAVICON, "fav-2x"), true)}</g>
      ${text(zoomX, tileY + tile + 40, "2x", { size: 20, fill: surface.text, font: "bb" })}
      ${text(zoomX, tileY + tile + 66, "Zoomed tab, favicon at 32 px", { size: 16, fill: surface.muted })}`;

    return mockupDoc(ctx, W, H, `${studio(ctx, W, H)}${frame}${callout}`);
  },
};
