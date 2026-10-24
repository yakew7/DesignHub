import {
  BAD,
  card,
  caption,
  checkIcon,
  CONTENT_TOP,
  CONTENT_WIDTH,
  GOOD,
  guidelinePage,
  MARGIN,
  paragraph,
} from "@/lib/guidelines/kit";
import type { GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { composeLogoWithGuides, logoAspect, nestLogo, type Rect } from "@/lib/logo/compose";
import { monochromeSvg } from "@/lib/logo/recolor";
import { invertedLockup, renderVariant, type LogoVariantId } from "@/lib/logo/variants";
import { text } from "@/lib/mockups/kit";

/** Fits any SVG into a box, centred, with ids namespaced so copies don't collide. */
function place(svg: string, rect: Rect, id: string): string {
  return nestLogo(svg, rect, id);
}

function inset(rect: Rect, pad: number): Rect {
  return { x: rect.x + pad, y: rect.y + pad, width: rect.width - pad * 2, height: rect.height - pad * 2 };
}

function variantTile(ctx: GuidelineContext, id: LogoVariantId, rect: Rect, label: string, background: string) {
  const r = Math.min(ctx.brand.radius, 16);
  return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${r}" fill="${background}" stroke="${ctx.surface.border}"/>
    ${place(renderVariant(id, ctx.logo), inset({ ...rect, height: rect.height - 40 }, 36), `lu-${id}`)}
    ${caption(ctx, rect.x + 24, rect.y + rect.height - 22, label)}`;
}

export const logoUsagePage: GuidelinePage = {
  id: "logo-usage",
  section: "Logo",
  title: "Logo Usage",
  description: "The primary logo and its approved lockups.",
  render(ctx, number) {
    const { surface } = ctx;
    const light = ctx.mode === "dark" ? "#ffffff" : surface.surface;
    const hero: Rect = { x: MARGIN, y: CONTENT_TOP, width: CONTENT_WIDTH * 0.46, height: 610 };
    const gx = hero.x + hero.width + 24;
    const gw = (MARGIN + CONTENT_WIDTH - gx - 24) / 2;
    const gh = (610 - 24) / 2;
    const r = Math.min(ctx.brand.radius, 16);
    const body = `<rect x="${hero.x}" y="${hero.y}" width="${hero.width}" height="${hero.height}" rx="${r}" fill="${light}" stroke="${surface.border}"/>
      ${place(renderVariant("color", ctx.logo), inset({ ...hero, height: hero.height - 60 }, 130), "lu-hero")}
      ${caption(ctx, hero.x + 28, hero.y + hero.height - 28, "Primary logo")}
      ${variantTile(ctx, "horizontal", { x: gx, y: CONTENT_TOP, width: gw, height: gh }, "Horizontal lockup", light)}
      ${variantTile(ctx, "stacked", { x: gx + gw + 24, y: CONTENT_TOP, width: gw, height: gh }, "Stacked lockup", light)}
      <rect x="${gx}" y="${CONTENT_TOP + gh + 24}" width="${gw}" height="${gh}" rx="${r}" fill="${ctx.logo.dark}"/>
      ${place(invertedLockup(ctx.logo), inset({ x: gx, y: CONTENT_TOP + gh + 24, width: gw, height: gh - 40 }, 36), "lu-inv")}
      ${text(gx + 24, CONTENT_TOP + gh * 2 + 2, "ON DARK", { size: 13, fill: "#ffffff", font: "bb", spacing: 2, opacity: 0.7 })}
      ${variantTile(ctx, "app-icon", { x: gx + gw + 24, y: CONTENT_TOP + gh + 24, width: gw, height: gh }, "App icon", light)}`;
    return guidelinePage(
      ctx,
      number,
      {
        section: "Logo",
        title: "Logo usage",
        lead: "Use the primary logo wherever possible. Lockups are for layouts where the mark alone is not enough.",
      },
      body,
    );
  },
};

export const clearSpacePage: GuidelinePage = {
  id: "clear-space",
  section: "Logo",
  title: "Clear Space",
  description: "Minimum empty space around the logo.",
  render(ctx, number) {
    const { surface } = ctx;
    const guide = composeLogoWithGuides(ctx.logo.logo, {
      grid: false,
      clearSpace: true,
      safeArea: false,
      clearSpaceRatio: ctx.clearSpace,
      background: ctx.mode === "dark" ? "#ffffff" : null,
    });
    const boxW = CONTENT_WIDTH * 0.56;
    const r = Math.min(ctx.brand.radius, 16);
    const percent = Math.round(ctx.clearSpace * 100);
    const tx = MARGIN + boxW + 60;
    const tw = CONTENT_WIDTH - boxW - 60;
    const grid = composeLogoWithGuides(ctx.logo.logo, {
      grid: true,
      clearSpace: false,
      safeArea: true,
      clearSpaceRatio: ctx.clearSpace,
      background: ctx.mode === "dark" ? "#ffffff" : null,
    });
    const body = `<rect x="${MARGIN}" y="${CONTENT_TOP}" width="${boxW}" height="610" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
      ${place(guide, inset({ x: MARGIN, y: CONTENT_TOP, width: boxW, height: 610 }, 60), "cs-guide")}
      ${caption(ctx, tx, CONTENT_TOP + 10, "The rule")}
      ${text(tx, CONTENT_TOP + 90, `${percent}%`, { size: 72, fill: surface.primary, font: "h" })}
      ${text(tx, CONTENT_TOP + 130, "of the logo height on every side", { size: 22, fill: surface.text })}
      ${paragraph(
        ctx,
        "Keep text, images and other graphics out of this zone. More space is always fine. When the logo sits inside a shape, measure from the edge of the shape.",
        tx,
        CONTENT_TOP + 190,
        tw,
        18,
        surface.muted,
        5,
      )}
      ${card(ctx, tx, CONTENT_TOP + 330, tw, 280)}
      ${place(grid, inset({ x: tx, y: CONTENT_TOP + 330, width: tw, height: 240 }, 20), "cs-grid")}
      ${caption(ctx, tx + 24, CONTENT_TOP + 590, "Construction grid and safe area")}`;
    return guidelinePage(ctx, number, { section: "Logo", title: "Clear space" }, body);
  },
};

export const minimumSizePage: GuidelinePage = {
  id: "minimum-size",
  section: "Logo",
  title: "Minimum Size",
  description: "The smallest sizes the logo stays legible at.",
  render(ctx, number) {
    const { surface } = ctx;
    const aspect = logoAspect(ctx.logo.logo);
    const sizes = [128, 64, 48, 32, 24, 16];
    const markY = CONTENT_TOP + 60;
    let x = MARGIN + 40;
    const marks = sizes
      .map((size) => {
        const w = size * aspect;
        const ok = size >= 24;
        const out = `${place(ctx.logo.logo, { x, y: markY + 128 - size, width: w, height: size }, `ms-${size}`)}
          ${text(x + w / 2, markY + 170, `${size}px`, { size: 16, fill: surface.text, font: "bb", anchor: "middle" })}
          ${checkIcon(x + w / 2, markY + 205, ok ? GOOD : BAD, ok)}`;
        x += Math.max(w, 60) + 70;
        return out;
      })
      .join("");

    const lockup = renderVariant("horizontal", ctx.logo);
    const lockupAspect = logoAspect(lockup);
    const lockSizes = [64, 40, 24];
    let lx = MARGIN + 40;
    const lockY = CONTENT_TOP + 360;
    const locks = lockSizes
      .map((h) => {
        const w = h * lockupAspect;
        const ok = h >= 24;
        const label = `${Math.round(w)} × ${h}px`;
        const labelWidth = ctx.measure(label, ctx.brand.typography.body, 600, 16);
        const out = `${place(lockup, { x: lx, y: lockY + 64 - h, width: w, height: h }, `ml-${h}`)}
          ${text(lx, lockY + 100, label, { size: 16, fill: surface.text, font: "bb" })}
          ${checkIcon(lx + labelWidth + 24, lockY + 95, ok ? GOOD : BAD, ok)}`;
        lx += Math.max(w, labelWidth + 40) + 80;
        return out;
      })
      .join("");

    const rules = [
      ["Mark, digital", "24 px"],
      ["Mark, print", "8 mm"],
      ["Lockup, digital", `${Math.round(24 * lockupAspect)} px wide`],
      ["Favicon", "Use the app icon at 16 px and up"],
    ];
    const ry = CONTENT_TOP + 520;
    const table = rules
      .map(
        ([label, value], i) =>
          `${text(MARGIN + (i % 2) * (CONTENT_WIDTH / 2), ry + Math.floor(i / 2) * 44, label ?? "", { size: 18, fill: surface.muted })}${text(MARGIN + (i % 2) * (CONTENT_WIDTH / 2) + 220, ry + Math.floor(i / 2) * 44, value ?? "", { size: 18, fill: surface.text, font: "bb" })}`,
      )
      .join("");

    const body = `${card(ctx, MARGIN, CONTENT_TOP, CONTENT_WIDTH, 290)}
      ${caption(ctx, MARGIN + 40, CONTENT_TOP + 36, "Mark")}
      ${marks}
      ${card(ctx, MARGIN, CONTENT_TOP + 310, CONTENT_WIDTH, 170)}
      ${caption(ctx, MARGIN + 40, CONTENT_TOP + 346, "Horizontal lockup")}
      ${locks}
      ${table}`;
    return guidelinePage(
      ctx,
      number,
      {
        section: "Logo",
        title: "Minimum size",
        lead: "Below these sizes detail fills in and the name stops being readable.",
      },
      body,
    );
  },
};

export const incorrectUsagePage: GuidelinePage = {
  id: "incorrect-usage",
  section: "Logo",
  title: "Incorrect Usage",
  description: "Common mistakes to avoid.",
  render(ctx, number) {
    const { surface } = ctx;
    const svg = ctx.logo.logo;
    const cols = 3;
    const gap = 24;
    const w = (CONTENT_WIDTH - gap * (cols - 1)) / cols;
    const h = 290;
    const r = Math.min(ctx.brand.radius, 16);
    const markSize = 130;
    const aspect = logoAspect(svg);
    const mw = markSize * aspect;
    const bg = ctx.mode === "dark" ? "#ffffff" : surface.surface;

    const examples: { label: string; draw: (cx: number, cy: number, id: string) => string; fill?: string }[] = [
      {
        label: "Don't stretch or squash",
        draw: (cx, cy, id) =>
          `<svg x="${cx - mw * 0.8}" y="${cy - markSize * 0.35}" width="${mw * 1.6}" height="${markSize * 0.7}" viewBox="0 0 ${mw} ${markSize}" preserveAspectRatio="none">${place(svg, { x: 0, y: 0, width: mw, height: markSize }, id).replace('preserveAspectRatio="xMidYMid meet"', 'preserveAspectRatio="none"')}</svg>`,
      },
      {
        label: "Don't rotate",
        draw: (cx, cy, id) =>
          `<g transform="rotate(-18 ${cx} ${cy})">${place(svg, { x: cx - mw / 2, y: cy - markSize / 2, width: mw, height: markSize }, id)}</g>`,
      },
      {
        label: "Don't change the colors",
        draw: (cx, cy, id) =>
          place(
            monochromeSvg(svg, "#84cc16"),
            { x: cx - mw / 2, y: cy - markSize / 2, width: mw, height: markSize },
            id,
          ),
      },
      {
        label: "Don't add effects",
        draw: (cx, cy, id) =>
          `<g filter="url(#bad-shadow)">${place(svg, { x: cx - mw / 2, y: cy - markSize / 2, width: mw, height: markSize }, id)}</g>`,
      },
      {
        label: "Don't place on low contrast",
        fill: surface.primary,
        draw: (cx, cy, id) =>
          `<g opacity=".9">${place(monochromeSvg(svg, surface.secondary), { x: cx - mw / 2, y: cy - markSize / 2, width: mw, height: markSize }, id)}</g>`,
      },
      {
        label: "Don't outline",
        draw: (cx, cy, id) =>
          place(svg, { x: cx - mw / 2, y: cy - markSize / 2, width: mw, height: markSize }, id).replace(
            /fill="(?!none)[^"]*"/g,
            `fill="none" stroke="${surface.text}" stroke-width="3"`,
          ),
      },
    ];

    const tiles = examples
      .map((example, i) => {
        const x = MARGIN + (i % cols) * (w + gap);
        const y = CONTENT_TOP + Math.floor(i / cols) * (h + gap);
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${example.fill ?? bg}" stroke="${surface.border}"/>
          ${example.draw(x + w / 2, y + (h - 50) / 2, `iu-${i}`)}
          <rect x="${x}" y="${y + h - 56}" width="${w}" height="56" fill="${surface.background}" fill-opacity=".92"/>
          ${checkIcon(x + 34, y + h - 28, BAD, false)}
          ${text(x + 60, y + h - 21, example.label, { size: 18, fill: surface.text })}`;
      })
      .join("");

    return guidelinePage(
      ctx,
      number,
      { section: "Logo", title: "Incorrect usage" },
      tiles,
      `<filter id="bad-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="8" dy="10" stdDeviation="6" flood-color="#000" flood-opacity=".55"/></filter>`,
    );
  },
};
