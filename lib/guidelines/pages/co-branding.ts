import {
  BAD,
  caption,
  checkIcon,
  CONTENT_BOTTOM,
  CONTENT_TOP,
  CONTENT_WIDTH,
  GOOD,
  guidelinePage,
  MARGIN,
  paragraph,
} from "@/lib/guidelines/kit";
import type { GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { logoAspect, nestLogo, type Rect } from "@/lib/logo/compose";
import { monochromeSvg } from "@/lib/logo/recolor";
import { onPrimaryLarge, text } from "@/lib/mockups/kit";

/** Neutral greys for the placeholder partner and the divider. Tiles are always light, so they read in both modes. */
const PARTNER_INK = "#52525b";
const DIVIDER = "#a1a1aa";

const PARTNER_WORD = "Partner";
/** Text size and gap after the shape, as fractions of the mark's height. */
const WORD_SIZE = 0.5;
const WORD_GAP = 0.28;

/** Width over height of the placeholder partner mark: a square shape and the word "Partner". */
function partnerAspect(ctx: GuidelineContext): number {
  const word = ctx.measure(PARTNER_WORD, ctx.brand.typography.body, 600, 100) / 100;
  // A little slack, since the word is measured before the brand font may have loaded.
  return 1 + WORD_GAP + word * WORD_SIZE * 1.05;
}

/** A deliberately generic stand-in, never a real company's logo. */
function partnerMark(rect: Rect, ink: string, cutout: string): string {
  const h = rect.height;
  return `<g aria-label="Partner logo placeholder">
    <rect x="${rect.x}" y="${rect.y}" width="${h}" height="${h}" rx="${h * 0.22}" fill="${ink}"/>
    <circle cx="${rect.x + h / 2}" cy="${rect.y + h / 2}" r="${h * 0.2}" fill="${cutout}"/>
    ${text(rect.x + h * (1 + WORD_GAP), rect.y + h * 0.68, PARTNER_WORD, { size: h * WORD_SIZE, fill: ink, font: "bb" })}
  </g>`;
}

type LockupOptions = {
  ctx: GuidelineContext;
  logo: string;
  id: string;
  /** Box the lockup is fitted into. */
  box: Rect;
  ink: string;
  cutout: string;
  divider: string | null;
  /** Partner area relative to ours: 1 is balanced. */
  partnerScale?: number;
  /** Gap on each side of the divider, as a fraction of our logo height. Defaults to the clear space. */
  gap?: number;
  /** Draw the clear space zones around each mark. */
  guides?: boolean;
};

/**
 * Our logo, a divider and the partner mark, matched by area rather than width or height, so a
 * wide wordmark and a tall emblem carry the same weight. Sizes are worked out for a unit area
 * and then scaled to fit the box, since every distance grows linearly with the logo size.
 */
function lockup({ ctx, logo, id, box, ink, cutout, divider, partnerScale = 1, gap, guides = false }: LockupOptions) {
  const ours = logoAspect(logo);
  const theirs = partnerAspect(ctx);
  const oh = Math.sqrt(1 / ours);
  const ow = oh * ours;
  const ph = Math.sqrt(partnerScale / theirs);
  const pw = ph * theirs;
  const space = (gap ?? ctx.clearSpace) * oh;
  // The clear space zone sits outside the lockup too.
  const pad = guides ? ctx.clearSpace * oh : 0;
  const width = ow + space * 2 + pw + pad * 2;
  const height = Math.max(oh, ph) + pad * 2;
  const s = Math.min(box.width / width, box.height / height);

  const x0 = box.x + (box.width - width * s) / 2 + pad * s;
  const cy = box.y + box.height / 2;
  const ourRect: Rect = { x: x0, y: cy - (oh * s) / 2, width: ow * s, height: oh * s };
  const dividerX = x0 + (ow + space) * s;
  const partnerRect: Rect = { x: dividerX + space * s, y: cy - (ph * s) / 2, width: pw * s, height: ph * s };
  const lineHeight = Math.max(oh, ph) * s;

  const zone = (rect: Rect, left: number, right: number) =>
    `<rect x="${rect.x - left}" y="${rect.y - pad * s}" width="${rect.width + left + right}" height="${rect.height + pad * s * 2}" fill="${ctx.surface.primary}" fill-opacity=".08" stroke="${ctx.surface.primary}" stroke-dasharray="6 5" stroke-opacity=".7"/>`;
  const markY = cy + lineHeight / 2 + pad * s + 22;
  // Two "x" labels collide when the gaps are narrow (wide logos), so one label covers both.
  const narrow = space * s < 28;
  const zones = guides
    ? `${zone(ourRect, pad * s, space * s)}${zone(partnerRect, space * s, pad * s)}
       ${measureMark(ctx, ourRect.x + ourRect.width, dividerX, markY, narrow ? "" : "x")}
       ${measureMark(ctx, dividerX, partnerRect.x, markY, narrow ? "" : "x")}
       ${narrow ? text(dividerX, markY + 26, "x on each side", { size: 16, fill: guideInk(ctx), font: "bb", anchor: "middle" }) : ""}`
    : "";

  return `${zones}
    ${nestLogo(logo, ourRect, id)}
    ${divider ? `<rect x="${dividerX - 1}" y="${cy - lineHeight / 2}" width="2" height="${lineHeight}" fill="${divider}"/>` : ""}
    ${partnerMark(partnerRect, ink, cutout)}`;
}

/** Guides sit on the light tile, where dark mode's lightened text colors would wash out. */
const guideInk = (ctx: GuidelineContext) => (ctx.mode === "dark" ? PARTNER_INK : ctx.surface.primaryText);

/** A dimension line between two points, with an optional label under it. */
function measureMark(ctx: GuidelineContext, from: number, to: number, y: number, label: string): string {
  const color = guideInk(ctx);
  if (to - from < 4) return "";
  return `<path d="M${from} ${y - 6}v12M${to} ${y - 6}v12M${from} ${y}H${to}" stroke="${color}" stroke-width="1.5"/>
    ${label ? text((from + to) / 2, y + 26, label, { size: 16, fill: color, font: "bb", anchor: "middle" }) : ""}`;
}

function verdictTile(ctx: GuidelineContext, rect: Rect, fill: string, ok: boolean, label: string, art: string) {
  const r = Math.min(ctx.brand.radius, 16);
  const { surface } = ctx;
  return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${r}" fill="${fill}" stroke="${surface.border}"/>
    ${art}
    <rect x="${rect.x}" y="${rect.y + rect.height - 56}" width="${rect.width}" height="56" fill="${surface.background}" fill-opacity=".92"/>
    ${checkIcon(rect.x + 34, rect.y + rect.height - 28, ok ? GOOD : BAD, ok)}
    ${text(rect.x + 60, rect.y + rect.height - 21, label, { size: 18, fill: surface.text })}`;
}

export const coBrandingPage: GuidelinePage = {
  id: "co-branding",
  title: "Co-branding",
  description: "How the logo sits next to a partner's logo.",
  render(ctx, number) {
    const { surface } = ctx;
    const logo = ctx.logo.logo;
    const tile = ctx.mode === "dark" ? "#ffffff" : surface.surface;
    const r = Math.min(ctx.brand.radius, 16);
    const percent = Math.round(ctx.clearSpace * 100);

    const heroW = CONTENT_WIDTH * 0.6;
    const heroH = 370;
    const hero: Rect = { x: MARGIN, y: CONTENT_TOP, width: heroW, height: heroH };
    const heroArt = lockup({
      ctx,
      logo,
      id: "cb-hero",
      box: { x: hero.x + 60, y: hero.y + 30, width: heroW - 120, height: heroH - 150 },
      ink: PARTNER_INK,
      cutout: tile,
      divider: DIVIDER,
      guides: true,
    });

    const tx = MARGIN + heroW + 56;
    const tw = MARGIN + CONTENT_WIDTH - tx - 16;
    const rules: [string, string][] = [
      [
        "Divider",
        "A thin neutral line as tall as the taller logo separates the two marks. Never use a brand color for it.",
      ],
      [
        "Spacing",
        `x is ${percent}% of our logo height, the same as the clear space. Keep x on each side of the divider and the full clear space around the lockup.`,
      ],
      [
        "Size balance",
        "Match the logos by area, not by width or height, so a wide wordmark and a tall emblem look equally important.",
      ],
    ];
    const ruleBlock = rules
      .map(
        ([title, body], i) => `${caption(ctx, tx, CONTENT_TOP + 10 + i * 128, title)}
          ${paragraph(ctx, body, tx, CONTENT_TOP + 44 + i * 128, tw, 18, surface.muted, 3)}`,
      )
      .join("");

    const tileY = CONTENT_TOP + heroH + 24;
    const tileH = CONTENT_BOTTOM - tileY;
    const tileW = (CONTENT_WIDTH - 24) / 2;
    const artBox = (x: number): Rect => ({ x: x + 70, y: tileY + 30, width: tileW - 140, height: tileH - 116 });

    const onPrimary = onPrimaryLarge(ctx);
    const doTile = verdictTile(
      ctx,
      { x: MARGIN, y: tileY, width: tileW, height: tileH },
      surface.primary,
      true,
      "Use one-color versions together on color or photos",
      lockup({
        ctx,
        logo: monochromeSvg(logo, onPrimary),
        id: "cb-do",
        box: artBox(MARGIN),
        ink: onPrimary,
        cutout: surface.primary,
        divider: onPrimary,
      }),
    );
    const dontX = MARGIN + tileW + 24;
    const dontTile = verdictTile(
      ctx,
      { x: dontX, y: tileY, width: tileW, height: tileH },
      tile,
      false,
      "Don't let one logo overpower or crowd the other",
      lockup({
        ctx,
        logo,
        id: "cb-dont",
        box: artBox(dontX),
        ink: PARTNER_INK,
        cutout: tile,
        divider: null,
        partnerScale: 6,
        gap: 0.04,
      }),
    );

    const body = `<rect x="${hero.x}" y="${hero.y}" width="${hero.width}" height="${hero.height}" rx="${r}" fill="${tile}" stroke="${surface.border}"/>
      ${heroArt}
      ${text(hero.x + 28, hero.y + heroH - 26, "OUR LOGO, DIVIDER, PARTNER", { size: 13, fill: ctx.mode === "dark" ? PARTNER_INK : surface.muted, font: "bb", spacing: 2 })}
      ${ruleBlock}
      ${doTile}
      ${dontTile}`;

    return guidelinePage(
      ctx,
      number,
      {
        section: "Logo",
        title: "Co-branding",
        lead: "When we appear with a partner, both logos share one lockup with equal visual weight.",
      },
      body,
    );
  },
};
