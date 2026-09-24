import { CREDIT_TEXT } from "@/lib/export/credit";
import { rasterize } from "@/lib/export/raster";
import { slugify } from "@/lib/logo/pack";
import { socialTemplates } from "@/lib/social/registry";
import type { SocialContext } from "@/lib/social/types";
import { createZip, type ZipEntry } from "@/lib/zip";

/** Every social template as a PNG at its platform size, grouped by platform. */
export async function buildSocialPack(
  ctx: SocialContext,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const base = slugify(ctx.brand.name);
  const entries: ZipEntry[] = [];
  const readme = [`${ctx.brand.name} social assets`, ""];
  let done = 0;
  for (const template of socialTemplates) {
    const image = await rasterize(template.render(ctx), 1);
    const name = `${slugify(template.platform)}/${base}-${template.id}.png`;
    entries.push({ name, data: image.bytes });
    readme.push(`${name}  ${template.width}x${template.height}  ${template.description}`);
    onProgress?.(++done, socialTemplates.length);
  }
  readme.push("", CREDIT_TEXT);
  entries.unshift({ name: "README.txt", data: `${readme.join("\n")}\n` });
  return createZip(entries);
}
