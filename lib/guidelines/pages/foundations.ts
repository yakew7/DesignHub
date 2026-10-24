import { contrastRatio, formatColor, parseColor, toHex } from "@/lib/color/color";
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
import { shadowFilter } from "@/lib/guidelines/shadow";
import type { GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { escapeXml, onPrimaryLarge, text } from "@/lib/mockups/kit";

const ratio = (a: string, b: string) => {
  const x = parseColor(a);
  const y = parseColor(b);
  return x && y ? contrastRatio(x, y) : 1;
};

export const colorPalettePage: GuidelinePage = {
  id: "color-palette",
  section: "Color",
  title: "Color Palette",
  description: "Brand colors with roles, values and shades.",
  render(ctx, number) {
    const { surface, brand, tokens } = ctx;
    const colors = brand.colors.all.slice(0, 6);
    const gap = 20;
    const w = (CONTENT_WIDTH - gap * (colors.length - 1)) / Math.max(1, colors.length);
    const h = 330;
    const r = Math.min(brand.radius, 16);
    const swatches = colors
      .map((color, i) => {
        const x = MARGIN + i * (w + gap);
        const value = parseColor(color.hex);
        const on = ratio(color.hex, "#ffffff") >= ratio(color.hex, "#000000") ? "#ffffff" : "#111111";
        const shades = tokens.colors[brand.colors.all.indexOf(color)]?.shades ?? [];
        const sw = w / Math.max(1, shades.length);
        const strip = shades
          .map(
            (shade, j) =>
              `<rect x="${x + j * sw}" y="${CONTENT_TOP + h + 16}" width="${sw + 0.5}" height="44" fill="${toHex(shade.value)}"/>`,
          )
          .join("");
        return `<clipPath id="sw-${i}"><rect x="${x}" y="${CONTENT_TOP}" width="${w}" height="${h + 60}" rx="${r}"/></clipPath>
          <g clip-path="url(#sw-${i})">
            <rect x="${x}" y="${CONTENT_TOP}" width="${w}" height="${h}" fill="${color.hex}"/>
            <rect x="${x}" y="${CONTENT_TOP + h}" width="${w}" height="60" fill="${surface.surface}"/>
            ${strip}
          </g>
          <rect x="${x}" y="${CONTENT_TOP}" width="${w}" height="${h + 60}" rx="${r}" fill="none" stroke="${surface.border}"/>
          ${text(x + 24, CONTENT_TOP + 44, color.role.toUpperCase(), { size: 13, fill: on, font: "bb", spacing: 2, opacity: 0.85 })}
          ${text(x + 24, CONTENT_TOP + h - 96, color.name, { size: 26, fill: on, font: "h" })}
          ${text(x + 24, CONTENT_TOP + h - 62, color.hex.toUpperCase(), { size: 16, fill: on, font: "bb" })}
          ${value ? text(x + 24, CONTENT_TOP + h - 38, formatColor(value, "rgb"), { size: 13, fill: on, opacity: 0.85 }) : ""}
          ${value ? text(x + 24, CONTENT_TOP + h - 18, formatColor(value, "oklch"), { size: 13, fill: on, opacity: 0.85 }) : ""}`;
      })
      .join("");
    const gy = CONTENT_TOP + h + 110;
    const gradient = `<defs><linearGradient id="pal-grad" x1="0" x2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient></defs>
      ${caption(ctx, MARGIN, gy, "Brand gradient")}
      <rect x="${MARGIN}" y="${gy + 18}" width="${CONTENT_WIDTH * 0.62}" height="90" rx="${r}" fill="url(#pal-grad)"/>
      ${caption(ctx, MARGIN + CONTENT_WIDTH * 0.62 + 40, gy, "Usage")}
      ${paragraph(
        ctx,
        "Lead with the primary color for actions and highlights. Keep secondary for accents and neutrals for text and surfaces.",
        MARGIN + CONTENT_WIDTH * 0.62 + 40,
        gy + 44,
        CONTENT_WIDTH * 0.38 - 40,
        17,
        surface.muted,
        3,
      )}`;
    return guidelinePage(ctx, number, { section: "Color", title: "Color palette" }, `${swatches}${gradient}`);
  },
};

export const typographyPage: GuidelinePage = {
  id: "typography",
  section: "Type",
  title: "Typography",
  description: "Typefaces, weights and the type scale.",
  render(ctx, number) {
    const { surface, brand } = ctx;
    const t = brand.typography;
    const colW = CONTENT_WIDTH * 0.42;
    const face = (x: number, y: number, family: string, cls: "h" | "b", role: string, detail: string) => `
      ${card(ctx, x, y, colW, 290)}
      ${caption(ctx, x + 32, y + 42, role)}
      <text class="${cls}" x="${x + 32}" y="${y + 170}" font-size="120" fill="${surface.primary}">Aa</text>
      ${text(x + 230, y + 120, family, { size: 34, fill: surface.text, font: cls === "h" ? "h" : "bb" })}
      ${text(x + 230, y + 156, detail, { size: 16, fill: surface.muted })}
      <text class="${cls}" x="${x + 32}" y="${y + 236}" font-size="22" fill="${surface.muted}">ABCDEFGHIJKLMNOPQRSTUVWXYZ</text>
      <text class="${cls}" x="${x + 32}" y="${y + 266}" font-size="22" fill="${surface.muted}">abcdefghijklmnopqrstuvwxyz 0123456789</text>`;
    const faces = `${face(MARGIN, CONTENT_TOP, t.heading, "h", "Headings", `${t.headingCategory}, weight ${t.headingWeight}, leading ${t.headingLineHeight}`)}
      ${face(MARGIN, CONTENT_TOP + 320, t.body, "b", "Body", `${t.bodyCategory}, weight ${t.bodyWeight}, leading ${t.bodyLineHeight}`)}`;

    const sx = MARGIN + colW + 60;
    const sw = CONTENT_WIDTH - colW - 60;
    const steps = [...t.scale].sort((a, b) => b.maxPx - a.maxPx).slice(0, 7);
    let y = CONTENT_TOP + 30;
    const scale = steps
      .map((step) => {
        const size = Math.min(step.maxPx, 56);
        const baseline = y + size * 0.85;
        y = baseline + 34;
        const label = `${Math.round(step.minPx)}-${Math.round(step.maxPx)}px`;
        const sample = escapeXml(step.maxPx >= 28 ? brand.name : brand.description || brand.name);
        return `${text(sx, baseline - 16, step.name, { size: 14, fill: surface.primaryText, font: "bb" })}
          ${text(sx, baseline + 2, label, { size: 12, fill: surface.muted })}
          <text class="${step.maxPx >= 24 ? "h" : "b"}" x="${sx + 130}" y="${baseline}" font-size="${size}" fill="${surface.text}">${sample}</text>
          <rect x="${sx}" y="${baseline + 16}" width="${sw}" height="1" fill="${surface.border}"/>`;
      })
      .join("");

    return guidelinePage(
      ctx,
      number,
      { section: "Typography", title: "Typography" },
      `${faces}${caption(ctx, sx, CONTENT_TOP, "Type scale, mobile to desktop")}<svg x="0" y="0" width="${MARGIN + CONTENT_WIDTH}" height="${CONTENT_TOP + 640}" overflow="hidden">${scale}</svg>`,
    );
  },
};

/** Simple 24 × 24 line icons, drawn here so the page needs no network. */
const icons: Record<string, string> = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  search: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm5 12l5 5",
  user: "M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c0-4 3.6-7 8-7s8 3 8 7",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  heart: "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  check: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM8 12l3 3 5-6",
  star: "M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z",
  sliders: "M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4",
};

function icon(name: string, x: number, y: number, size: number, color: string, stroke = 2): string {
  const s = size / 24;
  return `<path transform="translate(${x} ${y}) scale(${s})" d="${icons[name] ?? ""}" fill="none" stroke="${color}" stroke-width="${stroke / s}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
}

export const iconographyPage: GuidelinePage = {
  id: "iconography",
  section: "Imagery",
  title: "Iconography",
  description: "Icon style, sizes and colors.",
  render(ctx, number) {
    const { surface, brand } = ctx;
    const names = Object.keys(icons);
    const r = Math.min(brand.radius, 16);
    const gridW = CONTENT_WIDTH * 0.58;
    const cell = gridW / 5;
    const set = names
      .map((name, i) => {
        const x = MARGIN + (i % 5) * cell;
        const y = CONTENT_TOP + 60 + Math.floor(i / 5) * 130;
        return `${icon(name, x + cell / 2 - 24, y, 48, surface.text)}${text(x + cell / 2, y + 84, name, { size: 14, fill: surface.muted, anchor: "middle" })}`;
      })
      .join("");
    const sizes = [16, 20, 24, 32, 48];
    let sx = MARGIN + 30;
    const sizeRow = sizes
      .map((size) => {
        const out = `${icon("star", sx, CONTENT_TOP + 420 + (48 - size) / 2, size, surface.primary)}${text(sx + size / 2, CONTENT_TOP + 500, `${size}`, { size: 14, fill: surface.muted, anchor: "middle" })}`;
        sx += size + 70;
        return out;
      })
      .join("");
    const rx = MARGIN + gridW + 40;
    const rw = CONTENT_WIDTH - gridW - 40;
    const on = onPrimaryLarge(ctx);
    const tiles = `<rect x="${rx}" y="${CONTENT_TOP + 330}" width="${(rw - 20) / 3}" height="120" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
      ${icon("heart", rx + (rw - 20) / 6 - 20, CONTENT_TOP + 370, 40, surface.text)}
      <rect x="${rx + (rw - 20) / 3 + 10}" y="${CONTENT_TOP + 330}" width="${(rw - 20) / 3}" height="120" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
      ${icon("heart", rx + (rw - 20) / 2 + 10 - 20, CONTENT_TOP + 370, 40, surface.primary)}
      <rect x="${rx + ((rw - 20) * 2) / 3 + 20}" y="${CONTENT_TOP + 330}" width="${(rw - 20) / 3}" height="120" rx="${r}" fill="${surface.primary}"/>
      ${icon("heart", rx + ((rw - 20) * 5) / 6 + 20 - 20, CONTENT_TOP + 370, 40, on)}`;
    const rules = [
      "2 px stroke at 24 px, round caps and joins.",
      "Use one icon set across the product. Icon Studio searches 200,000+ open source icons.",
      "Pair icons with a text label unless the meaning is universal.",
      "Icons inherit text color. Use primary only for active states.",
    ];
    const ruleList = rules
      .map(
        (rule, i) =>
          paragraph(ctx, rule, rx + 20, CONTENT_TOP + 40 + i * 64, rw - 20, 17, surface.text, 2) +
          `<circle cx="${rx + 4}" cy="${CONTENT_TOP + 34 + i * 64}" r="4" fill="${surface.primary}"/>`,
      )
      .join("");
    return guidelinePage(
      ctx,
      number,
      { section: "Iconography", title: "Iconography" },
      `${caption(ctx, MARGIN, CONTENT_TOP, "Style")}${set}${caption(ctx, MARGIN, CONTENT_TOP + 390, "Sizes")}${sizeRow}
      ${caption(ctx, rx, CONTENT_TOP, "Rules")}${ruleList}${caption(ctx, rx, CONTENT_TOP + 310, "Color")}${tiles}`,
    );
  },
};

export const componentsPage: GuidelinePage = {
  id: "ui-components",
  section: "UI",
  title: "UI Components",
  description: "Buttons, inputs, badges and cards built from the tokens.",
  render(ctx, number) {
    const { surface, brand } = ctx;
    const on = onPrimaryLarge(ctx);
    const r = Math.min(brand.radius, 28);
    const bw = 200;
    const buttons = [
      { label: "Primary", fill: surface.primary, color: on, stroke: "none" },
      { label: "Secondary", fill: surface.surface, color: surface.text, stroke: surface.border },
      { label: "Outline", fill: "none", color: surface.primary, stroke: surface.primary },
      { label: "Ghost", fill: "none", color: surface.text, stroke: "none" },
    ]
      .map((b, i) => {
        const x = MARGIN + i * (bw + 20);
        return `<rect x="${x}" y="${CONTENT_TOP + 40}" width="${bw}" height="56" rx="${r}" fill="${b.fill}" stroke="${b.stroke}" stroke-width="2"/>
          ${text(x + bw / 2, CONTENT_TOP + 75, b.label, { size: 19, fill: b.color, font: "bb", anchor: "middle" })}`;
      })
      .join("");
    const iy = CONTENT_TOP + 170;
    const input = `${text(MARGIN, iy, "Email", { size: 16, fill: surface.text, font: "bb" })}
      <rect x="${MARGIN}" y="${iy + 14}" width="420" height="52" rx="${Math.min(r, 12)}" fill="${surface.background}" stroke="${surface.border}" stroke-width="2"/>
      ${text(MARGIN + 18, iy + 47, "you@example.com", { size: 17, fill: surface.muted })}
      ${text(MARGIN + 460, iy, "Focused", { size: 16, fill: surface.text, font: "bb" })}
      <rect x="${MARGIN + 456}" y="${iy + 10}" width="428" height="60" rx="${Math.min(r, 12) + 4}" fill="none" stroke="${surface.primary}" stroke-opacity=".35" stroke-width="4"/>
      <rect x="${MARGIN + 460}" y="${iy + 14}" width="420" height="52" rx="${Math.min(r, 12)}" fill="${surface.background}" stroke="${surface.primary}" stroke-width="2"/>
      ${text(MARGIN + 478, iy + 47, "jordan@", { size: 17, fill: surface.text })}`;
    const by = iy + 130;
    let bx = MARGIN;
    const badges = ["New", "Beta", "Pro", "Draft"]
      .map((label, i) => {
        const w = ctx.measure(label, brand.typography.body, 600, 15) + 30;
        const color = i === 1 ? surface.secondary : i === 3 ? surface.muted : surface.primary;
        const out = `<rect x="${bx}" y="${by}" width="${w}" height="32" rx="16" fill="${color}" fill-opacity=".14"/>${text(bx + w / 2, by + 21, label, { size: 15, fill: i === 3 ? surface.text : color, font: "bb", anchor: "middle" })}`;
        bx += w + 12;
        return out;
      })
      .join("");
    const toggle = `<rect x="${MARGIN + 460}" y="${by}" width="60" height="32" rx="16" fill="${surface.primary}"/><circle cx="${MARGIN + 504}" cy="${by + 16}" r="12" fill="#fff"/>
      ${text(MARGIN + 536, by + 22, "Notifications", { size: 17, fill: surface.text })}`;
    const cx = MARGIN + 960;
    const cw = CONTENT_WIDTH - 960;
    const cardMarkup = `<rect x="${cx}" y="${CONTENT_TOP + 40}" width="${cw}" height="480" rx="${Math.min(r, 20)}" fill="${surface.background}" stroke="${surface.border}" filter="url(#brand-shadow)"/>
      <rect x="${cx}" y="${CONTENT_TOP + 40}" width="${cw}" height="160" rx="${Math.min(r, 20)}" fill="url(#card-grad)"/>
      <rect x="${cx}" y="${CONTENT_TOP + 180}" width="${cw}" height="20" fill="url(#card-grad)"/>
      ${text(cx + 32, CONTENT_TOP + 250, "Card title", { size: 26, fill: surface.text, font: "h" })}
      ${paragraph(ctx, `Cards use the ${brand.radius}px radius, the brand shadow and ${brand.spacing * 4}px padding.`, cx + 32, CONTENT_TOP + 290, cw - 64, 17, surface.muted, 3)}
      <rect x="${cx + 32}" y="${CONTENT_TOP + 430}" width="${cw - 64}" height="56" rx="${r}" fill="${surface.primary}"/>
      ${text(cx + cw / 2, CONTENT_TOP + 465, "Continue", { size: 19, fill: on, font: "bb", anchor: "middle" })}`;
    const specs = [
      ["Radius", `${brand.radius}px`],
      ["Spacing unit", `${brand.spacing}px`],
      ["Shadow", brand.shadowLayers.length ? `${brand.shadowLayers.length} layers` : "None"],
    ]
      .map(
        ([k, v], i) =>
          `${text(MARGIN + i * 300, CONTENT_TOP + 560, k ?? "", { size: 16, fill: surface.muted })}${text(MARGIN + i * 300, CONTENT_TOP + 590, v ?? "", { size: 20, fill: surface.text, font: "bb" })}`,
      )
      .join("");
    const defs = `${shadowFilter("brand-shadow", brand.shadowLayers)}<linearGradient id="card-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient>`;
    return guidelinePage(
      ctx,
      number,
      { section: "Components", title: "UI components" },
      `${caption(ctx, MARGIN, CONTENT_TOP, "Buttons")}${buttons}${caption(ctx, MARGIN, iy - 34, "Inputs")}${input}${caption(ctx, MARGIN, by - 20, "Badges and toggles")}${badges}${toggle}${specs}${cardMarkup}`,
      defs,
    );
  },
};

function level(value: number): { label: string; ok: boolean } {
  if (value >= 7) return { label: "AAA", ok: true };
  if (value >= 4.5) return { label: "AA", ok: true };
  if (value >= 3) return { label: "AA Large", ok: true };
  return { label: "Fail", ok: false };
}

export const accessibilityPage: GuidelinePage = {
  id: "accessibility",
  section: "UI",
  title: "Accessibility",
  description: "Contrast checks for the brand's key color pairs.",
  render(ctx: GuidelineContext, number: number) {
    const { surface, brand } = ctx;
    const on = onPrimaryLarge(ctx);
    const pairs: { label: string; fg: string; bg: string }[] = [
      { label: "Body text on background", fg: surface.text, bg: surface.background },
      { label: "Muted text on background", fg: surface.muted, bg: surface.background },
      { label: "Primary on background", fg: surface.primary, bg: surface.background },
      { label: "Label on primary", fg: on, bg: surface.primary },
      { label: "Secondary on background", fg: surface.secondary, bg: surface.background },
      { label: "Text on surface", fg: surface.text, bg: surface.surface },
    ];
    const colW = (CONTENT_WIDTH - 24) / 2;
    const rowH = 96;
    const rows = pairs
      .map((pair, i) => {
        const x = MARGIN + (i % 2) * (colW + 24);
        const y = CONTENT_TOP + Math.floor(i / 2) * (rowH + 16);
        const value = ratio(pair.fg, pair.bg);
        const result = level(value);
        const r = Math.min(brand.radius, 14);
        return `${card(ctx, x, y, colW, rowH)}
          <rect x="${x + 16}" y="${y + 16}" width="120" height="${rowH - 32}" rx="${r}" fill="${pair.bg}" stroke="${surface.border}"/>
          <text class="h" x="${x + 76}" y="${y + rowH / 2 + 14}" font-size="38" fill="${pair.fg}" text-anchor="middle">Aa</text>
          ${text(x + 160, y + 42, pair.label, { size: 19, fill: surface.text, font: "bb" })}
          ${text(x + 160, y + 70, `${pair.fg.toUpperCase()} on ${pair.bg.toUpperCase()}`, { size: 14, fill: surface.muted })}
          ${text(x + colW - 150, y + 58, `${value.toFixed(2)}:1`, { size: 26, fill: surface.text, font: "h", anchor: "end" })}
          ${checkIcon(x + colW - 116, y + 50, result.ok ? GOOD : BAD, result.ok)}
          ${text(x + colW - 94, y + 56, result.label, { size: 15, fill: surface.text, font: "bb" })}`;
      })
      .join("");
    const ny = CONTENT_TOP + 3 * (rowH + 16) + 40;
    const notes = [
      "Body text needs 4.5:1. Large text (24 px, or 19 px bold) and icons need 3:1.",
      "Show a visible focus ring on every interactive element.",
      "Make touch targets at least 44 × 44 px.",
      "Never use color alone to carry meaning. Pair it with text or an icon.",
    ];
    const noteMarkup = notes
      .map(
        (note, i) =>
          `<circle cx="${MARGIN + (i % 2) * (colW + 24) + 6}" cy="${ny + Math.floor(i / 2) * 50 - 6}" r="4" fill="${surface.primary}"/>${text(MARGIN + (i % 2) * (colW + 24) + 22, ny + Math.floor(i / 2) * 50, note, { size: 17, fill: surface.text })}`,
      )
      .join("");
    return guidelinePage(
      ctx,
      number,
      {
        section: "Accessibility",
        title: "Accessibility",
        lead: "Checked against WCAG 2.2. Ratios update as the palette changes.",
      },
      `${rows}${noteMarkup}`,
    );
  },
};
