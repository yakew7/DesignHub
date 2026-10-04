import { PDFHexString, PDFName, PDFNull, type PDFDocument, type PDFRef } from "pdf-lib";

import { contentsRows } from "@/lib/guidelines/pages/intro";
import { PAGE_HEIGHT, PAGE_WIDTH, type GuidelineContext } from "@/lib/guidelines/types";

/**
 * Adds a bookmark per page and makes every Introduction contents row a link to its page.
 * pdf-lib has no outline API, so both are built from its low-level objects. `contents` must
 * list the PDF's pages in order (switched-off pages are already left out).
 */
export function addBookNavigation(pdf: PDFDocument, contents: GuidelineContext["contents"]): void {
  const { context } = pdf;
  const pages = pdf.getPages();
  // Jump to the top-left of the page and keep the reader's zoom.
  const destination = (number: number) => {
    const page = pages[number - 1];
    return page ? context.obj([page.ref, PDFName.of("XYZ"), 0, page.getHeight(), PDFNull]) : undefined;
  };

  const entries = contents.filter((entry) => pages[entry.number - 1]);
  if (entries.length > 0) {
    const outlines = context.nextRef();
    const refs: PDFRef[] = entries.map(() => context.nextRef());
    entries.forEach((entry, i) => {
      const item = context.obj({
        Title: PDFHexString.fromText(entry.title),
        Parent: outlines,
        Dest: destination(entry.number),
      });
      const prev = refs[i - 1];
      const next = refs[i + 1];
      if (prev) item.set(PDFName.of("Prev"), prev);
      if (next) item.set(PDFName.of("Next"), next);
      context.assign(refs[i]!, item);
    });
    context.assign(
      outlines,
      context.obj({ Type: "Outlines", First: refs[0], Last: refs[refs.length - 1], Count: refs.length }),
    );
    pdf.catalog.set(PDFName.of("Outlines"), outlines);
    // Open with the bookmarks panel showing.
    pdf.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
  }

  const intro = contents.find((entry) => entry.id === "introduction");
  const introPage = intro ? pages[intro.number - 1] : undefined;
  if (!introPage) return;
  // Page units (1600 × 1000, y down) to PDF points (y up).
  const sx = introPage.getWidth() / PAGE_WIDTH;
  const sy = introPage.getHeight() / PAGE_HEIGHT;
  for (const { entry, rect } of contentsRows(contents)) {
    const dest = destination(entry.number);
    if (!dest) continue;
    const link = context.register(
      context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [
          rect.x * sx,
          (PAGE_HEIGHT - rect.y - rect.height) * sy,
          (rect.x + rect.width) * sx,
          (PAGE_HEIGHT - rect.y) * sy,
        ],
        Border: [0, 0, 0],
        Dest: dest,
      }),
    );
    introPage.node.addAnnot(link);
  }
}
