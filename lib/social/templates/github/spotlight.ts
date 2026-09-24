import { brandSurface } from "@/lib/brand/theme";
import { logo, text } from "@/lib/mockups/kit";
import { githubBanner, H, W } from "@/lib/social/templates/github/kit";
import { backdrop } from "@/lib/social/templates/shared";

/** A dark stage, one beam of light and a huge logo. Almost no copy. */
export const githubSpotlight = githubBanner("Spotlight", "Dramatic lighting, a huge logo, minimal content.", (ctx) => {
  const { content } = ctx;
  const stage = brandSurface(ctx.brand, "dark");
  const mark = 250;
  const cy = H * 0.44;
  return {
    defs: `<radialGradient id="spot-beam" cx=".5" cy="0" r="1" fx=".5" fy="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".28"/><stop offset=".45" stop-color="${stage.primary}" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="spot-floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${stage.primary}" stop-opacity=".45"/><stop offset="1" stop-color="${stage.primary}" stop-opacity="0"/></radialGradient>
      <filter id="spot-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>`,
    body: `${backdrop(ctx, W, H, () => `<rect width="${W}" height="${H}" fill="#030305"/>`)}
      <path d="M${W / 2 - 60} 0H${W / 2 + 60}L${W / 2 + 420} ${H}H${W / 2 - 420}Z" fill="url(#spot-beam)"/>
      <ellipse cx="${W / 2}" cy="${H - 70}" rx="360" ry="46" fill="url(#spot-floor)"/>
      <circle cx="${W / 2}" cy="${cy}" r="${mark * 0.5}" fill="${stage.primary}" fill-opacity=".45" filter="url(#spot-glow)"/>
      ${logo(ctx, { x: W / 2 - mark / 2, y: cy - mark / 2, width: mark, height: mark }, undefined, "spot-mark")}
      ${text(W / 2, H - 112, content.name, { size: 34, fill: "#ffffff", font: "h", anchor: "middle" })}
      ${text(W / 2, H - 74, `${content.website}  ·  github.com/${content.github}`, { size: 17, fill: "#ffffff", anchor: "middle", opacity: 0.6 })}`,
  };
});
