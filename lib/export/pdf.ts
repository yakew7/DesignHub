import { CREDIT_TEXT } from "@/lib/export/credit";
import type { RasterImage } from "@/lib/export/raster";

export type PdfPage = {
  image: RasterImage;
  /** Page size in PDF points; defaults to the image at 72 dpi / scale. */ width?: number;
  height?: number;
};

/**
 * One image per page, each page sized to its image. pdf-lib is loaded on demand.
 * `scale` is the rasterization factor, so a 2× image lands at its original size.
 */
export type PdfMeta = { title: string; scale?: number; author?: string; subject?: string; keywords?: string[] };

export async function imagesToPdf(pages: PdfPage[], meta: PdfMeta): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle(meta.title);
  pdf.setCreator(CREDIT_TEXT);
  pdf.setProducer("DesignHub");
  if (meta.author) pdf.setAuthor(meta.author);
  if (meta.subject) pdf.setSubject(meta.subject);
  if (meta.keywords) pdf.setKeywords(meta.keywords);
  const scale = meta.scale ?? 2;
  for (const page of pages) {
    const png =
      page.image.format === "jpeg" ? await pdf.embedJpg(page.image.bytes) : await pdf.embedPng(page.image.bytes);
    // CSS px → PDF pt (1px = 0.75pt), undoing the rasterization factor.
    const width = page.width ?? (page.image.width / scale) * 0.75;
    const height = page.height ?? (page.image.height / scale) * 0.75;
    const target = pdf.addPage([width, height]);
    target.drawImage(png, { x: 0, y: 0, width, height });
  }
  return pdf.save();
}
