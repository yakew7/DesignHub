import { CREDIT_TEXT } from "@/lib/export/credit";
import { rasterize } from "@/lib/export/raster";
import { slugify } from "@/lib/logo/pack";
import { isCoreTemplate, loadSocialTemplate, socialTemplates } from "@/lib/social/registry";
import type { SocialContext } from "@/lib/social/types";
import { createZip, type ZipEntry } from "@/lib/zip";

/** Templates of the core platforms: the pack when nothing was chosen. The others are added by choice. */
export function defaultPackTemplates() {
  return socialTemplates.filter(isCoreTemplate);
}

/** Templates a pack will contain: the saved selection, or the core platforms when there is none. */
export function packTemplates(selection: string[] | null) {
  return selection ? socialTemplates.filter((template) => selection.includes(template.id)) : defaultPackTemplates();
}

/** Lets the page handle input between two templates: rasterizing each one takes long enough to be felt. */
const yieldToPage = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** The words of the pack's README.txt. Without them it is in English. */
export type PackReadmeText = {
  /** The first line, from the brand's name. */
  title: (brand: string) => string;
  /** A template's description, in the language of the interface. */
  describe: (template: { id: string; description: string }) => string;
};

/**
 * The selected social templates as PNGs at their platform sizes, grouped by platform. Pass a `signal` to
 * stop between templates: the build then rejects with an AbortError and nothing is returned.
 */
export async function buildSocialPack(
  ctx: SocialContext,
  onProgress?: (done: number, total: number) => void,
  selection: string[] | null = null,
  signal?: AbortSignal,
  text?: PackReadmeText,
): Promise<Uint8Array> {
  const templates = packTemplates(selection);
  const base = slugify(ctx.brand.name);
  const entries: ZipEntry[] = [];
  const readme = [text ? text.title(ctx.brand.name) : `${ctx.brand.name} social assets`, ""];
  let done = 0;
  for (const info of templates) {
    await yieldToPage();
    signal?.throwIfAborted();
    // Each template's code is loaded as the pack reaches it, so only the chosen ones are fetched.
    const template = await loadSocialTemplate(info.id);
    if (!template) throw new Error(`Social template ${info.id} could not be loaded`);
    const image = await rasterize(template.render(ctx), 1);
    const name = `${slugify(template.platform)}/${base}-${template.id}.png`;
    entries.push({ name, data: image.bytes });
    readme.push(
      `${name}  ${template.width}x${template.height}  ${text ? text.describe(template) : template.description}`,
    );
    onProgress?.(++done, templates.length);
  }
  readme.push("", CREDIT_TEXT);
  entries.unshift({ name: "README.txt", data: `${readme.join("\n")}\n` });
  return createZip(entries);
}
