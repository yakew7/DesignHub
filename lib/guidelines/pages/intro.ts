import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
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
import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  type CoverStyle,
  type GuidelineContext,
  type GuidelinePage,
} from "@/lib/guidelines/types";

/** Shrinks a heading so a long brand name still fits on one line. */
function fitSize(ctx: GuidelineContext, value: string, width: number, size: number): number {
  const { heading, headingWeight } = ctx.brand.typography;
  const measured = ctx.measure(value, heading, headingWeight, size);
  return measured > width ? Math.max(40, Math.floor((size * width) / measured)) : size;
}

const editionLine = (ctx: GuidelineContext) => (ctx.date ? `Version 1.0  ·  ${ctx.date}` : "Version 1.0");

function gradientCover(ctx: GuidelineContext): string {
  const { surface, brand } = ctx;
  const on = onPrimaryLarge(ctx);
  const W = PAGE_WIDTH;
  const H = PAGE_HEIGHT;
  const nameSize = fitSize(ctx, brand.name, W - 240, 150);
  return `<defs><linearGradient id="cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#cover)"/>
      <circle cx="${W}" cy="0" r="620" fill="none" stroke="${on}" stroke-opacity=".12" stroke-width="28"/>
      <circle cx="${W}" cy="0" r="420" fill="none" stroke="${on}" stroke-opacity=".12" stroke-width="28"/>
      ${logo(ctx, { x: 120, y: 120, width: 120, height: 120 }, on, "cover")}
      ${text(120, 640, brand.name, { size: nameSize, fill: on, font: "h" })}
      ${text(126, 720, "Brand guidelines", { size: 44, fill: on, opacity: 0.9 })}
      <rect x="120" y="${H - 150}" width="${W - 240}" height="1.5" fill="${on}" fill-opacity=".4"/>
      ${text(120, H - 100, editionLine(ctx), { size: 20, fill: on, opacity: 0.85 })}
      ${text(W - 120, H - 100, brand.description, { size: 20, fill: on, anchor: "end", opacity: 0.85 })}`;
}

function minimalCover(ctx: GuidelineContext): string {
  const { surface, brand } = ctx;
  const W = PAGE_WIDTH;
  const H = PAGE_HEIGHT;
  const nameSize = fitSize(ctx, brand.name, W - 320, 110);
  return `<rect width="${W}" height="${H}" fill="${surface.background}"/>
      ${logo(ctx, { x: W / 2 - 130, y: 190, width: 260, height: 260 }, undefined, "cover")}
      ${text(W / 2, 600, brand.name, { size: nameSize, fill: surface.text, font: "h", anchor: "middle" })}
      ${text(W / 2, 668, "Brand guidelines", { size: 32, fill: surface.muted, anchor: "middle" })}
      ${text(W / 2, 722, editionLine(ctx), { size: 20, fill: surface.muted, anchor: "middle" })}
      <rect x="${W / 2 - 60}" y="${H - 170}" width="120" height="4" rx="2" fill="${surface.primary}"/>`;
}

function editorialCover(ctx: GuidelineContext): string {
  const { surface, brand } = ctx;
  const on = onPrimaryLarge(ctx);
  const W = PAGE_WIDTH;
  const H = PAGE_HEIGHT;
  const half = W / 2;
  const x = half + 90;
  const width = half - 180;
  const nameSize = fitSize(
    ctx,
    brand.name.split(/\s+/).sort((a, b) => b.length - a.length)[0] ?? brand.name,
    width,
    104,
  );
  const name = wrap(ctx, brand.name, width, nameSize, "h", 3);
  const nameMarkup = name
    .map((line, i) => text(x, 380 + i * nameSize * 1.08, line, { size: nameSize, fill: surface.text, font: "h" }))
    .join("");
  const below = 380 + (name.length - 1) * nameSize * 1.08;
  return `<rect width="${W}" height="${H}" fill="${surface.background}"/>
      <rect width="${half}" height="${H}" fill="${surface.primary}"/>
      ${logo(ctx, { x: half / 2 - 150, y: H / 2 - 150, width: 300, height: 300 }, on, "cover")}
      ${text(x, 250, "BRAND GUIDELINES", { size: 18, fill: surface.primaryText, font: "bb", spacing: 4 })}
      ${nameMarkup}
      <rect x="${x}" y="${below + 50}" width="90" height="4" rx="2" fill="${surface.primary}"/>
      ${paragraph(ctx, brand.description, x, below + 116, width, 24, surface.muted, 4)}
      ${text(x, H - 100, editionLine(ctx), { size: 20, fill: surface.muted })}`;
}

const coverLayouts: Record<CoverStyle, (ctx: GuidelineContext) => string> = {
  gradient: gradientCover,
  minimal: minimalCover,
  editorial: editorialCover,
};

export const coverPage: GuidelinePage = {
  id: "cover",
  title: "Cover",
  description: "Logo, name and edition.",
  render(ctx) {
    return mockupDoc(ctx, PAGE_WIDTH, PAGE_HEIGHT, coverLayouts[ctx.coverStyle]?.(ctx) ?? gradientCover(ctx));
  },
};

export const introductionPage: GuidelinePage = {
  id: "introduction",
  title: "Introduction",
  description: "Who the brand is, its personality and what this book covers.",
  render(ctx, number) {
    const { surface, brand, voice } = ctx;
    const left = MARGIN;
    const colW = CONTENT_WIDTH * 0.52;
    const personality = voice.personality.slice(0, 4);
    const chipY = CONTENT_TOP + 300;
    let chipX = left;
    const chips = personality
      .map((word) => {
        const w = ctx.measure(word, brand.typography.heading, brand.typography.headingWeight, 30) + 56;
        const out = `<rect x="${chipX}" y="${chipY}" width="${w}" height="64" rx="32" fill="${surface.primary}" fill-opacity=".12"/>
          ${text(chipX + w / 2, chipY + 42, word, { size: 30, fill: surface.text, font: "h", anchor: "middle" })}`;
        chipX += w + 16;
        return out;
      })
      .join("");

    const tocX = left + colW + 80;
    const tocW = PAGE_WIDTH - MARGIN - tocX;
    const entries = ctx.contents.filter((entry) => entry.id !== "cover");
    const rowH = Math.min(44, 560 / Math.max(1, entries.length));
    const toc = entries
      .map((entry, i) => {
        const y = CONTENT_TOP + 70 + i * rowH;
        return `${text(tocX + 32, y, String(entry.number).padStart(2, "0"), { size: 16, fill: surface.primaryText, font: "bb" })}
          ${text(tocX + 80, y, entry.title, { size: 18, fill: entry.id === "introduction" ? surface.muted : surface.text })}`;
      })
      .join("");

    const body = `${caption(ctx, left, CONTENT_TOP, `About ${brand.name}`)}
      ${text(left, CONTENT_TOP + 70, brand.description, { size: 34, fill: surface.text, font: "h" })}
      ${paragraph(ctx, voice.sample, left, CONTENT_TOP + 140, colW, 22, surface.muted, 4)}
      ${caption(ctx, left, chipY - 30, "Personality")}
      ${chips}
      ${paragraph(
        ctx,
        `This book explains how to use the ${brand.name} identity consistently: the logo, colors, type, components and voice. Every value comes from one shared token set.`,
        left,
        chipY + 130,
        colW,
        18,
        surface.muted,
        3,
      )}
      ${card(ctx, tocX, CONTENT_TOP - 10, tocW, 640)}
      ${caption(ctx, tocX + 32, CONTENT_TOP + 28, "Contents")}
      ${toc}`;
    return guidelinePage(ctx, number, { section: "Introduction", title: `Welcome to ${brand.name}` }, body);
  },
};

export const voicePage: GuidelinePage = {
  id: "voice",
  title: "Voice & Tone",
  description: "Personality, do and don't, and a sample of the voice.",
  render(ctx, number) {
    const { surface, voice, brand } = ctx;
    const pillars = voice.personality.slice(0, 3);
    const pw = (CONTENT_WIDTH - 48) / 3;
    const pillarCards = pillars
      .map((word, i) => {
        const x = MARGIN + i * (pw + 24);
        return `${card(ctx, x, CONTENT_TOP, pw, 150)}
          ${text(x + 32, CONTENT_TOP + 50, String(i + 1).padStart(2, "0"), { size: 16, fill: surface.primaryText, font: "bb" })}
          ${text(x + 32, CONTENT_TOP + 108, word, { size: 40, fill: surface.text, font: "h" })}`;
      })
      .join("");

    const listY = CONTENT_TOP + 210;
    const colW = (CONTENT_WIDTH - 24) / 2;
    const list = (items: string[], x: number, ok: boolean) =>
      items
        .slice(0, 4)
        .map(
          (item, i) =>
            `${checkIcon(x + 34, listY + 76 + i * 50, ok ? GOOD : BAD, ok)}${text(x + 62, listY + 83 + i * 50, item, { size: 20, fill: surface.text })}`,
        )
        .join("");
    const lists = `${card(ctx, MARGIN, listY, colW, 290)}
      ${caption(ctx, MARGIN + 32, listY + 40, "Do")}
      ${list(voice.dos, MARGIN, true)}
      ${card(ctx, MARGIN + colW + 24, listY, colW, 290)}
      ${caption(ctx, MARGIN + colW + 56, listY + 40, "Don't")}
      ${list(voice.donts, MARGIN + colW + 24, false)}`;

    const sampleY = listY + 320;
    const sample = `<rect x="${MARGIN}" y="${sampleY}" width="6" height="96" rx="3" fill="${surface.primary}"/>
      ${caption(ctx, MARGIN + 30, sampleY + 18, "Sounds like")}
      ${paragraph(ctx, `"${voice.sample}"`, MARGIN + 30, sampleY + 60, CONTENT_WIDTH - 60, 24, surface.text, 2)}`;

    return guidelinePage(
      ctx,
      number,
      {
        section: "Voice & Tone",
        title: `How ${brand.name} sounds`,
      },
      `${pillarCards}${lists}${sample}`,
    );
  },
};
