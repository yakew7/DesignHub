import { imagesToPdf, type PdfPage } from "@/lib/export/pdf";
import { rasterize } from "@/lib/export/raster";
import { guidelinePages } from "@/lib/guidelines/registry";
import type { GuidelineBase, GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";

/** Page size in points: 16:10 landscape, a little larger than A4 so small type stays crisp. */
const PAGE_PT = { width: 960, height: 600 };

/**
 * Renders every included page at 2× and binds them into one PDF with pdf-lib.
 * Pages are JPEG so a full book stays a few megabytes. Bookmarks and the clickable
 * contents list come from `ctx.contents`, so they skip switched-off pages too.
 */
export async function buildBrandBook(
  ctx: GuidelineContext,
  pages: GuidelinePage[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const images: PdfPage[] = [];
  for (const [i, page] of pages.entries()) {
    const image = await rasterize(page.render(ctx, i + 1), 2, 8192, "jpeg");
    images.push({ image, ...PAGE_PT });
    onProgress?.(i + 1, pages.length + 1);
  }
  const pdf = await imagesToPdf(images, {
    title: `${ctx.brand.name} brand guidelines`,
    author: ctx.brand.name,
    subject: ctx.brand.description,
    keywords: ["brand guidelines", ctx.brand.name, ...pages.map((page) => page.title)],
    finish: async (doc) => {
      const { addBookNavigation } = await import("@/lib/guidelines/outline");
      addBookNavigation(doc, ctx.contents);
    },
  });
  onProgress?.(pages.length + 1, pages.length + 1);
  return pdf;
}

/** The book from outside Brand Guidelines (Export Engine), honoring the pages switched off there. */
export function buildBrandBookFrom(
  base: GuidelineBase,
  excluded: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const pages = guidelinePages.filter((page) => !excluded.includes(page.id));
  const ctx: GuidelineContext = {
    ...base,
    contents: pages.map((page, i) => ({ id: page.id, title: page.title, number: i + 1 })),
  };
  return buildBrandBook(ctx, pages, onProgress);
}
