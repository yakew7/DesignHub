import { CREDIT_TEXT } from "@/lib/export/credit";
import { imagesToPdf } from "@/lib/export/pdf";
import { rasterize } from "@/lib/export/raster";
import { logoVariants, type LogoVariantId, type VariantContext } from "@/lib/logo/variants";
import { createZip, type ZipEntry } from "@/lib/zip";

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "brand"
  );
}

export async function variantPng(ctx: VariantContext, id: LogoVariantId): Promise<Uint8Array> {
  const variant = logoVariants.find((item) => item.id === id) ?? logoVariants[0]!;
  return (await rasterize(variant.render(ctx), 4)).bytes;
}

export async function variantPdf(ctx: VariantContext, id: LogoVariantId): Promise<Uint8Array> {
  const variant = logoVariants.find((item) => item.id === id) ?? logoVariants[0]!;
  const image = await rasterize(variant.render(ctx), 4);
  return imagesToPdf([{ image }], { title: `${ctx.name} logo (${variant.label})`, scale: 4 });
}

function usageNotes(ctx: VariantContext, clearSpace: number): string {
  return [
    `${ctx.name} logo pack`,
    "",
    "Files: every variant as SVG (vector, preferred), PNG (4x) and PDF.",
    "",
    "Usage",
    `- Clear space: keep at least ${Math.round(clearSpace * 100)}% of the logo height free on every side.`,
    "- Minimum size: 24px for the mark on screen, 96px wide for the horizontal lockup.",
    "- Use the inverted variant on dark or busy backgrounds.",
    "- Don't stretch, rotate, recolor outside the palette, or add effects.",
    "",
    `Primary color: ${ctx.primary}`,
    `Heading font: ${ctx.fontFamily}`,
    "",
    CREDIT_TEXT,
    "",
  ].join("\n");
}

/** Every variant in SVG, PNG and PDF, plus usage notes, zipped. */
export async function buildLogoPack(ctx: VariantContext, clearSpace: number): Promise<Uint8Array> {
  const base = slugify(ctx.name);
  const entries: ZipEntry[] = [{ name: "README.txt", data: usageNotes(ctx, clearSpace) }];
  for (const variant of logoVariants) {
    const svg = variant.render(ctx);
    const image = await rasterize(svg, 4);
    entries.push(
      { name: `svg/${base}-${variant.id}.svg`, data: svg },
      { name: `png/${base}-${variant.id}.png`, data: image.bytes },
      {
        name: `pdf/${base}-${variant.id}.pdf`,
        data: await imagesToPdf([{ image }], { title: `${ctx.name} ${variant.label}`, scale: 4 }),
      },
    );
  }
  return createZip(entries);
}
