import {
  BAD,
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
import { nestLogo } from "@/lib/logo/compose";
import { resolveSocialContent } from "@/lib/social/content";
import { getSocialTemplate } from "@/lib/social/registry";
import type { SocialContext } from "@/lib/social/types";
import { text } from "@/lib/mockups/kit";
import { defaultSocialContent } from "@/store/social-store";

type Palette = { sky: [string, string]; sun: string; far: string; near: string };

/**
 * A stand-in "photo" (sky, sun and two hills) drawn in the given colors, so the examples need
 * no image files and follow the brand automatically.
 */
function scene(id: string, x: number, y: number, w: number, h: number, colors: Palette, extra = ""): string {
  return `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colors.sky[0]}"/><stop offset="1" stop-color="${colors.sky[1]}"/></linearGradient>
      <clipPath id="${id}-clip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/></clipPath></defs>
    <g clip-path="url(#${id}-clip)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}-sky)"/>
      <circle cx="${x + w * 0.7}" cy="${y + h * 0.36}" r="${h * 0.14}" fill="${colors.sun}"/>
      <path d="M${x} ${y + h * 0.72} Q${x + w * 0.3} ${y + h * 0.42} ${x + w * 0.62} ${y + h * 0.66} T${x + w} ${y + h * 0.6} V${y + h} H${x} Z" fill="${colors.far}"/>
      <path d="M${x} ${y + h * 0.86} Q${x + w * 0.4} ${y + h * 0.64} ${x + w} ${y + h * 0.82} V${y + h} H${x} Z" fill="${colors.near}"/>
      ${extra}
    </g>`;
}

const TILE_GAP = 24;
const TILE_H = 220;
const ROW = TILE_H + 96;

function tile(
  ctx: GuidelineContext,
  index: number,
  row: number,
  width: number,
  label: string,
  ok: boolean,
  art: (x: number, y: number, w: number, h: number) => string,
): string {
  const x = MARGIN + index * (width + TILE_GAP);
  const y = CONTENT_TOP + 40 + row * ROW;
  return `${art(x, y, width, TILE_H)}
    ${checkIcon(x + 14, y + TILE_H + 32, ok ? GOOD : BAD, ok)}
    ${text(x + 38, y + TILE_H + 39, label, { size: 18, fill: ctx.surface.text })}`;
}

export const imageryPage: GuidelinePage = {
  id: "imagery",
  section: "Imagery",
  title: "Imagery",
  description: "Photography and illustration style, with do and don't examples.",
  render(ctx, number) {
    const { surface } = ctx;
    const gridW = CONTENT_WIDTH * 0.7;
    const w = (gridW - TILE_GAP * 2) / 3;
    const brand: Palette = {
      sky: [surface.primary, surface.secondary],
      sun: "#ffffff",
      far: surface.primaryText,
      near: surface.text,
    };
    const soft: Palette = {
      sky: [surface.surface, surface.background],
      sun: surface.secondary,
      far: surface.primary,
      near: surface.primaryText,
    };
    const offBrand: Palette = { sky: ["#a16207", "#84cc16"], sun: "#fef08a", far: "#3f6212", near: "#1a2e05" };

    const tiles = [
      tile(ctx, 0, 0, w, "Duotone in brand colors", true, (x, y, tw, th) => scene("im-duo", x, y, tw, th, brand)),
      tile(ctx, 1, 0, w, "One clear subject", true, (x, y, tw, th) =>
        scene(
          "im-crop",
          x,
          y,
          tw,
          th,
          soft,
          `<circle cx="${x + tw * 0.42}" cy="${y + th * 0.55}" r="${th * 0.26}" fill="${surface.primary}"/>`,
        ),
      ),
      tile(ctx, 2, 0, w, "Text on a solid band", true, (x, y, tw, th) =>
        scene(
          "im-band",
          x,
          y,
          tw,
          th,
          brand,
          `<rect x="${x}" y="${y + th - 64}" width="${tw}" height="64" fill="${surface.background}"/>${text(x + 20, y + th - 25, ctx.brand.name, { size: 22, fill: surface.text, font: "h" })}`,
        ),
      ),
      tile(ctx, 0, 1, w, "Text over a busy area", false, (x, y, tw, th) =>
        scene(
          "im-busy",
          x,
          y,
          tw,
          th,
          brand,
          `${Array.from({ length: 14 }, (_, i) => `<rect x="${x + i * 26}" y="${y}" width="12" height="${th}" fill="#ffffff" fill-opacity=".35" transform="rotate(20 ${x + tw / 2} ${y + th / 2})"/>`).join("")}${text(x + tw / 2, y + th / 2 + 10, ctx.brand.name, { size: 30, fill: "#ffffff", font: "h", anchor: "middle", opacity: 0.8 })}`,
        ),
      ),
      tile(ctx, 1, 1, w, "Off-brand filters", false, (x, y, tw, th) => scene("im-filter", x, y, tw, th, offBrand)),
      tile(
        ctx,
        2,
        1,
        w,
        "Stretched or squashed",
        false,
        (x, y, tw, th) =>
          `<svg x="${x}" y="${y}" width="${tw}" height="${th}" viewBox="0 0 ${tw} ${th * 1.9}" preserveAspectRatio="none">${scene("im-squash", 0, 0, tw, th * 1.9, brand)}</svg>`,
      ),
    ].join("");

    const rx = MARGIN + gridW + 60;
    const rw = CONTENT_WIDTH - gridW - 60;
    const rules = [
      "Pick images with one clear subject and room around it.",
      "Tint or duotone photos with the brand colors so a set feels like one family.",
      "Put text on a solid band or a calm area, never across detail.",
      "Keep original proportions. Crop instead of stretching.",
      "Prefer real people and products over generic stock.",
    ];
    const ruleMarkup = rules
      .map((rule, i) => {
        const y = CONTENT_TOP + 80 + i * 96;
        return `<circle cx="${rx + 5}" cy="${y - 6}" r="4" fill="${surface.primary}"/>${paragraph(ctx, rule, rx + 22, y, rw - 22, 18, surface.text, 3)}`;
      })
      .join("");

    return guidelinePage(
      ctx,
      number,
      { section: "Imagery", title: "Imagery" },
      `${caption(ctx, MARGIN, CONTENT_TOP + 16, "Do")}${caption(ctx, MARGIN, CONTENT_TOP + 16 + ROW, "Don't")}${tiles}
      ${caption(ctx, rx, CONTENT_TOP + 16, "Rules")}${ruleMarkup}`,
    );
  },
};

/** Templates shown on the Social media page, in order. */
const SOCIAL_SAMPLES = [
  "github-aurora",
  "linkedin-cover",
  "x-banner",
  "instagram-square",
  "og-article",
  "youtube-thumbnail",
];

export const socialMediaPage: GuidelinePage = {
  id: "social-media",
  section: "Voice",
  title: "Social Media",
  description: "The brand's social assets at their platform sizes.",
  render(ctx, number) {
    const { surface } = ctx;
    const social: SocialContext = {
      ...ctx,
      content: resolveSocialContent(defaultSocialContent, ctx.brand),
      layout: { padding: 80, background: "auto" },
    };
    const cols = 3;
    const w = (CONTENT_WIDTH - TILE_GAP * (cols - 1)) / cols;
    const boxH = 250;
    const tiles = SOCIAL_SAMPLES.map((id) => getSocialTemplate(id))
      .filter((template) => template !== undefined)
      .map((template, i) => {
        const x = MARGIN + (i % cols) * (w + TILE_GAP);
        const y = CONTENT_TOP + 10 + Math.floor(i / cols) * (boxH + 96);
        // Fit the asset inside the box while keeping its aspect ratio.
        const scale = Math.min(w / template.width, boxH / template.height);
        const tw = template.width * scale;
        const th = template.height * scale;
        const art = nestLogo(
          template.render(social),
          { x: x + (w - tw) / 2, y: y + (boxH - th) / 2, width: tw, height: th },
          `sm-${i}`,
        );
        return `<rect x="${x}" y="${y}" width="${w}" height="${boxH}" rx="12" fill="${surface.surface}" stroke="${surface.border}"/>
          ${art}
          ${text(x, y + boxH + 34, template.platform, { size: 18, fill: surface.text, font: "bb" })}
          ${text(x + w, y + boxH + 34, `${template.label.replace(/^Repository banner: /, "Banner, ")}  ·  ${template.width} × ${template.height}`, { size: 15, fill: surface.muted, anchor: "end" })}`;
      })
      .join("");
    return guidelinePage(
      ctx,
      number,
      {
        section: "Social media",
        title: "Social media",
        lead: "Every asset uses the same logo, colors and type. Generate the full set in Social Media Studio.",
      },
      tiles,
    );
  },
};
