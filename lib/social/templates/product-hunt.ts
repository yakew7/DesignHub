import { lines, logo, mockupDoc, onPrimaryLarge, text } from "@/lib/mockups/kit";
import { glowBackdrop, gradientBackdrop, heading, lockup, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1270;
const H = 760;

export const productHuntGallery: SocialTemplate = {
  id: "product-hunt-gallery",
  platform: "Product Hunt",
  label: "Gallery image",
  width: W,
  height: H,
  description: "Launch gallery slide, 1270 × 760. The first image doubles as the social preview.",
  safe: { x: 50, y: 40, width: W - 100, height: H - 80 },
  render(ctx) {
    const { surface, content, brand } = ctx;
    const on = onPrimaryLarge(ctx);
    const r = Math.min(brand.radius, 20);
    const title = heading(ctx, content.headline, W / 2, 190, W - 260, 60, on, { maxLines: 2, anchor: "middle" });
    const fw = 860;
    const fx = (W - fw) / 2;
    const fy = title.bottom + 70;
    const frame = `<g filter="url(#soft)"><rect x="${fx}" y="${fy}" width="${fw}" height="${H - fy + 40}" rx="${r + 6}" fill="${surface.background}"/></g>
      <rect x="${fx}" y="${fy}" width="${fw}" height="48" rx="${r + 6}" fill="${surface.surface}"/>
      <rect x="${fx}" y="${fy + 24}" width="${fw}" height="24" fill="${surface.surface}"/>
      <circle cx="${fx + 26}" cy="${fy + 24}" r="6" fill="#ff5f57"/><circle cx="${fx + 46}" cy="${fy + 24}" r="6" fill="#febc2e"/><circle cx="${fx + 66}" cy="${fy + 24}" r="6" fill="#28c840"/>
      ${lockup(ctx, fx + 40, fy + 100, 36, undefined, "ph-frame", 400)}
      ${lines(fx + 40, fy + 150, 380, 3, 28, surface.border)}
      <rect x="${fx + 460}" y="${fy + 84}" width="360" height="190" rx="${r}" fill="${surface.primary}" fill-opacity=".14"/>
      <rect x="${fx + 490}" y="${fy + 220}" width="120" height="24" rx="12" fill="${surface.primary}"/>
      ${[0, 1, 2]
        .map((i) => {
          const x = fx + 40 + i * 270;
          const color = i === 1 ? surface.secondary : surface.primary;
          return `<rect x="${x}" y="${fy + 300}" width="250" height="150" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
            <circle cx="${x + 40}" cy="${fy + 340}" r="14" fill="${color}"/>
            ${lines(x + 26, fy + 380, 198, 2, 26, surface.border)}`;
        })
        .join("")}`;
    const body = `${gradientBackdrop(ctx, W, H)}
      ${logo(ctx, { x: W / 2 - 28, y: 56, width: 56, height: 56 }, on, "ph-mark")}
      ${title.markup}
      ${text(W / 2, title.bottom + 44, content.subtitle, { size: 24, fill: on, anchor: "middle", opacity: 0.85 })}
      ${frame}`;
    return mockupDoc(ctx, W, H, body);
  },
};

export const youtubeThumbnail: SocialTemplate = {
  id: "youtube-thumbnail",
  platform: "YouTube",
  label: "Video thumbnail",
  width: 1280,
  height: 720,
  description: "Thumbnail, 1280 × 720. The duration badge covers the lower right.",
  safe: { x: 40, y: 40, width: 1200, height: 640 },
  covered: [{ x: 1110, y: 640, width: 150, height: 64 }],
  render(ctx) {
    const { surface, content } = ctx;
    const W2 = 1280;
    const H2 = 720;
    const pad = 72;
    // Thumbnails are read at a glance: few words, very large type.
    const title = heading(ctx, content.headline, pad, 300, 720, 100, surface.text, { maxLines: 3, leading: 1.02 });
    const cta = pill(ctx, pad, title.bottom + 56, content.cta || "Watch now", 30, {
      fill: surface.primary,
      text: onPrimaryLarge(ctx),
    });
    const body = `${glowBackdrop(ctx, W2, H2, 64)}
      <rect x="0" y="0" width="16" height="${H2}" fill="${surface.primary}"/>
      ${lockup(ctx, pad, 120, 46, undefined, "yt-lockup", 720)}
      ${title.markup}
      ${cta.markup}
      <circle cx="${W2 - 250}" cy="${H2 / 2}" r="190" fill="${surface.primary}" fill-opacity=".16"/>
      ${logo(ctx, { x: W2 - 390, y: H2 / 2 - 140, width: 280, height: 280 }, undefined, "yt-mark")}`;
    return mockupDoc(ctx, W2, H2, body);
  },
};
