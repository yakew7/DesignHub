import type { MockupContext } from "@/lib/mockups/types";

/**
 * Nested <svg> so screen content is drawn in its own coordinates and clipped to the display.
 * Content drawn at a different size (`viewWidth` × `viewHeight`) is scaled to fit.
 */
export function screen(
  x: number,
  y: number,
  width: number,
  height: number,
  body: string,
  viewWidth = width,
  viewHeight = height,
): string {
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${viewWidth} ${viewHeight}" overflow="hidden">${body}</svg>`;
}

/** A studio backdrop for screen mockups, lighter than the desk used for print. */
export function studio(ctx: MockupContext, width: number, height: number): string {
  const [a, b] = ctx.mode === "light" ? ["#f4f3f1", "#dcd9d4"] : ["#1b1c21", "#08090b"];
  return `<defs><radialGradient id="studio" cx=".5" cy=".35" r=".85"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs><rect width="${width}" height="${height}" fill="url(#studio)"/>`;
}

/** Laptop with the display at (x, y) and the given inner screen size. */
export function laptop(x: number, y: number, sw: number, sh: number, content: string): string {
  const bezel = 26;
  const w = sw + bezel * 2;
  const h = sh + bezel * 2;
  const baseH = 34;
  return `<g transform="translate(${x} ${y})">
    <rect width="${w}" height="${h}" rx="28" fill="#1d1e22" filter="url(#soft)"/>
    <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="26" fill="none" stroke="#3a3b41" stroke-width="2"/>
    <circle cx="${w / 2}" cy="${bezel / 2}" r="4" fill="#3a3b41"/>
    ${screen(bezel, bezel, sw, sh, content)}
    <path d="M${-110} ${h} H${w + 110} L${w + 70} ${h + baseH} Q${w + 60} ${h + baseH + 6} ${w + 40} ${h + baseH + 6} H-40 Q-60 ${h + baseH + 6} -70 ${h + baseH} Z" fill="#c9cace"/>
    <rect x="${-110}" y="${h}" width="${w + 220}" height="8" fill="#e4e5e8"/>
    <rect x="${w / 2 - 110}" y="${h}" width="220" height="12" rx="6" fill="#aeb0b5"/>
  </g>`;
}

/** Desktop monitor with stand. */
export function monitor(x: number, y: number, sw: number, sh: number, content: string): string {
  const bezel = 22;
  const w = sw + bezel * 2;
  const h = sh + bezel * 2 + 40;
  return `<g transform="translate(${x} ${y})">
    <path d="M${w / 2 - 90} ${h - 4} L${w / 2 - 120} ${h + 170} H${w / 2 + 120} L${w / 2 + 90} ${h - 4} Z" fill="#b9bbc0"/>
    <rect x="${w / 2 - 230}" y="${h + 160}" width="460" height="26" rx="13" fill="#cfd1d5" filter="url(#soft)"/>
    <rect width="${w}" height="${h}" rx="24" fill="#e7e8eb" filter="url(#soft)"/>
    <rect x="${bezel - 6}" y="${bezel - 6}" width="${sw + 12}" height="${sh + 12}" rx="8" fill="#111216"/>
    ${screen(bezel, bezel, sw, sh, content)}
  </g>`;
}

/**
 * Tablet with an even bezel and a front camera on the top edge, in either orientation. The
 * display is `sw` × `sh`; `content` is drawn at `cw` × `ch` and scaled to fill it.
 */
export function tablet(x: number, y: number, sw: number, sh: number, content: string, cw = sw, ch = sh): string {
  const bezel = 26;
  const w = sw + bezel * 2;
  const h = sh + bezel * 2;
  const id = `tablet-${x}-${y}`;
  return `<g transform="translate(${x} ${y})">
    <rect width="${w}" height="${h}" rx="42" fill="#1d1e22" filter="url(#soft)"/>
    <rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="40.5" fill="none" stroke="#45464d" stroke-width="3"/>
    <circle cx="${w / 2}" cy="${bezel / 2}" r="4" fill="#3a3b41"/>
    <clipPath id="${id}"><rect x="${bezel}" y="${bezel}" width="${sw}" height="${sh}" rx="18"/></clipPath>
    <g clip-path="url(#${id})">${screen(bezel, bezel, sw, sh, content, cw, ch)}</g>
  </g>`;
}

/** Modern phone with a dynamic island. Screen is 390 × 844 logical points. */
export function phone(x: number, y: number, content: string, scale = 1): string {
  const sw = 390;
  const sh = 844;
  const bezel = 14;
  const w = sw + bezel * 2;
  const h = sh + bezel * 2;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect width="${w}" height="${h}" rx="62" fill="#1a1b1f" filter="url(#soft)"/>
    <rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="60.5" fill="none" stroke="#45464d" stroke-width="3"/>
    <clipPath id="phone-${x}-${y}"><rect x="${bezel}" y="${bezel}" width="${sw}" height="${sh}" rx="48"/></clipPath>
    <g clip-path="url(#phone-${x}-${y})">${screen(bezel, bezel, sw, sh, content)}</g>
    <rect x="${w / 2 - 62}" y="${bezel + 12}" width="124" height="36" rx="18" fill="#000"/>
  </g>`;
}
