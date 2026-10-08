import { logo, mockupDoc, onPrimaryLarge, text, truncate } from "@/lib/mockups/kit";
import { monitor, studio } from "@/lib/mockups/templates/devices";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const SW = 1600;
const SH = 1000;

const series = [42, 48, 45, 58, 54, 66, 62, 74, 71, 83, 80, 92];

export function dashboard(ctx: MockupContext, width: number, height: number): string {
  const { surface, content, brand } = ctx;
  const onPrimary = onPrimaryLarge(ctx);
  const r = Math.min(brand.radius, 16);
  const side = 280;

  const nav = ["Overview", "Projects", "Analytics", "Customers", "Settings"];
  const navItems = nav
    .map((item, i) => {
      const y = 150 + i * 56;
      const active = i === 0;
      return `${active ? `<rect x="20" y="${y - 32}" width="${side - 40}" height="46" rx="${r}" fill="${surface.primary}" fill-opacity=".12"/>` : ""}
        <rect x="40" y="${y - 17}" width="16" height="16" rx="4" fill="${active ? surface.primary : surface.muted}" fill-opacity="${active ? 1 : 0.5}"/>
        ${text(72, y - 3, item, { size: 18, fill: active ? surface.text : surface.muted, font: active ? "bb" : "b" })}`;
    })
    .join("");

  const main = side + 48;
  const mainW = width - main - 48;
  const stats = [
    ["Revenue", "$48.2k", "+12.4%"],
    ["Active users", "9,381", "+5.1%"],
    ["Conversion", "3.8%", "+0.6%"],
    ["Churn", "1.2%", "-0.3%"],
  ];
  const sw = (mainW - 3 * 24) / 4;
  const statCards = stats
    .map(([label, value, delta], i) => {
      const x = main + i * (sw + 24);
      return `<rect x="${x}" y="140" width="${sw}" height="150" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
        ${text(x + 28, 184, label ?? "", { size: 17, fill: surface.muted })}
        ${text(x + 28, 238, value ?? "", { size: 38, fill: surface.text, font: "h" })}
        ${text(x + 28, 270, delta ?? "", { size: 15, fill: surface.primaryText, font: "bb" })}`;
    })
    .join("");

  const cx = main;
  const cy = 318;
  const cw = mainW * 0.64;
  const ch = 400;
  const px = (i: number) => cx + 40 + (i / (series.length - 1)) * (cw - 80);
  const py = (v: number) => cy + ch - 50 - (v / 100) * (ch - 130);
  const path = series.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
  const area = `${path} L${px(series.length - 1).toFixed(1)} ${cy + ch - 50} L${px(0).toFixed(1)} ${cy + ch - 50} Z`;
  const grid = [0, 1, 2, 3]
    .map((i) => `<rect x="${cx + 40}" y="${cy + 90 + i * 70}" width="${cw - 80}" height="1" fill="${surface.border}"/>`)
    .join("");
  const chart = `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
    ${text(cx + 40, cy + 54, "Revenue over time", { size: 22, fill: surface.text, font: "h" })}
    ${grid}
    <path d="${area}" fill="url(#area)"/>
    <path d="${path}" fill="none" stroke="${surface.primary}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${px(series.length - 1)}" cy="${py(series.at(-1) ?? 0)}" r="8" fill="${surface.primary}" stroke="${surface.background}" stroke-width="4"/>`;

  const lx = cx + cw + 24;
  const lw = mainW - cw - 24;
  const channels = [
    ["Organic", 0.72],
    ["Referral", 0.54],
    ["Social", 0.38],
    ["Email", 0.26],
  ] as const;
  const bars = channels
    .map(([label, value], i) => {
      const y = cy + 110 + i * 68;
      return `${text(lx + 32, y, label, { size: 16, fill: surface.muted })}
        <rect x="${lx + 32}" y="${y + 14}" width="${lw - 64}" height="12" rx="6" fill="${surface.border}"/>
        <rect x="${lx + 32}" y="${y + 14}" width="${((lw - 64) * value).toFixed(0)}" height="12" rx="6" fill="${i % 2 ? surface.secondary : surface.primary}"/>`;
    })
    .join("");
  const breakdown = `<rect x="${lx}" y="${cy}" width="${lw}" height="${ch}" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
    ${text(lx + 32, cy + 54, "Channels", { size: 22, fill: surface.text, font: "h" })}
    ${bars}`;

  const ty = cy + ch + 24;
  const rows = ["Website redesign", "Brand refresh", "Mobile launch"];
  const table = `<rect x="${main}" y="${ty}" width="${mainW}" height="${height - ty - 36}" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
    ${rows
      .map((row, i) => {
        const y = ty + 52 + i * 62;
        return `${i ? `<rect x="${main + 32}" y="${y - 36}" width="${mainW - 64}" height="1" fill="${surface.border}"/>` : ""}
          ${text(main + 32, y, row, { size: 18, fill: surface.text, font: "bb" })}
          ${text(main + mainW * 0.45, y, content.person, { size: 17, fill: surface.muted })}
          <rect x="${main + mainW - 172}" y="${y - 24}" width="140" height="34" rx="17" fill="${i === 0 ? surface.primary : surface.border}" fill-opacity="${i === 0 ? 0.14 : 1}"/>
          ${text(main + mainW - 102, y - 1, i === 0 ? "In progress" : "Done", { size: 15, fill: i === 0 ? surface.primary : surface.muted, font: "bb", anchor: "middle" })}`;
      })
      .join("")}`;

  const initials = content.person
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `<defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${surface.primary}" stop-opacity=".3"/><stop offset="1" stop-color="${surface.primary}" stop-opacity="0"/></linearGradient></defs>
    <rect width="${width}" height="${height}" fill="${surface.background}"/>
    <rect width="${side}" height="${height}" fill="${surface.surface}"/>
    <rect x="${side}" width="1" height="${height}" fill="${surface.border}"/>
    ${logo(ctx, { x: 32, y: 32, width: 36, height: 36 }, undefined, "db-nav")}
    ${text(80, 58, truncate(ctx, brand.name, side - 80 - 24, 22, "h"), { size: 22, fill: surface.text, font: "h" })}
    ${navItems}
    ${text(main, 90, "Overview", { size: 34, fill: surface.text, font: "h" })}
    <rect x="${width - 48 - 380}" y="54" width="300" height="48" rx="${Math.min(r, 24)}" fill="${surface.surface}" stroke="${surface.border}"/>
    ${text(width - 48 - 356, 85, "Search...", { size: 17, fill: surface.muted })}
    <circle cx="${width - 48 - 28}" cy="78" r="26" fill="${surface.primary}"/>
    ${text(width - 48 - 28, 85, initials, { size: 18, fill: onPrimary, font: "bb", anchor: "middle" })}
    ${statCards}
    ${chart}
    ${breakdown}
    ${table}`;
}

export const desktopDashboard: MockupTemplate = {
  id: "desktop-dashboard",
  label: "Dashboard",
  category: "Screens",
  description: "Analytics dashboard on a desktop display.",
  render(ctx) {
    const width = 2000;
    const height = 1500;
    const x = (width - (SW + 44)) / 2;
    return mockupDoc(
      ctx,
      width,
      height,
      `${studio(ctx, width, height)}${monitor(x, 70, SW, SH, dashboard(ctx, SW, SH))}`,
    );
  },
};
