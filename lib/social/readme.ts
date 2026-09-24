import { siteConfig } from "@/lib/site";
import type { SocialContext } from "@/lib/social/types";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * README markup for a repository banner. GitHub renders this HTML subset, so the banner is
 * centred and the optional credit sits underneath it as small text, never on the image.
 */
export function readmeSnippet(ctx: SocialContext, options: { path: string; credit: boolean }): string {
  const alt = escapeHtml(`${ctx.content.name}: ${ctx.content.headline}`);
  const lines = ['<p align="center">', `  <img src="${options.path}" alt="${alt}" width="100%" />`, "</p>"];
  if (options.credit) {
    lines.push(`<p align="center"><sub>Banner made with <a href="${siteConfig.github}">DesignHub</a></sub></p>`);
  }
  return `${lines.join("\n")}\n`;
}
