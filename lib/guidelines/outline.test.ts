import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef } from "pdf-lib";
import { describe, expect, test } from "vitest";

import { addBookNavigation } from "@/lib/guidelines/outline";
import { guidelinePages } from "@/lib/guidelines/registry";

/** A book with blank pages for the given page ids, saved and parsed back like a reader would. */
async function book(excluded: string[] = []) {
  const pages = guidelinePages.filter((page) => !excluded.includes(page.id));
  const contents = pages.map((page, i) => ({ id: page.id, title: page.title, number: i + 1 }));
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pages.length; i++) pdf.addPage([960, 600]);
  addBookNavigation(pdf, contents);
  return { contents, pdf: await PDFDocument.load(await pdf.save()) };
}

/** Walks the outline from /First along /Next. */
function outlineItems(pdf: PDFDocument): PDFDict[] {
  const outlines = pdf.catalog.lookup(PDFName.of("Outlines"), PDFDict);
  const items: PDFDict[] = [];
  let ref = outlines.get(PDFName.of("First"));
  while (ref instanceof PDFRef && items.length < 100) {
    const item = pdf.context.lookup(ref, PDFDict);
    items.push(item);
    ref = item.get(PDFName.of("Next"));
  }
  expect(outlines.get(PDFName.of("Count"))?.toString()).toBe(String(items.length));
  return items;
}

const pageIndex = (pdf: PDFDocument, dest: PDFArray) => pdf.getPages().findIndex((page) => page.ref === dest.get(0));

describe("brand book navigation", () => {
  test("adds one bookmark per page, in page order", async () => {
    const { contents, pdf } = await book();
    const items = outlineItems(pdf);
    expect(items).toHaveLength(guidelinePages.length);
    items.forEach((item, i) => {
      expect(item.lookup(PDFName.of("Title"), PDFHexString).decodeText()).toBe(contents[i]!.title);
      expect(pageIndex(pdf, item.lookup(PDFName.of("Dest"), PDFArray))).toBe(i);
    });
  });

  test("skips switched-off pages", async () => {
    const { pdf } = await book(["mission", "imagery", "tokens-scale"]);
    const titles = outlineItems(pdf).map((item) => item.lookup(PDFName.of("Title"), PDFHexString).decodeText());
    expect(titles).toHaveLength(guidelinePages.length - 3);
    expect(titles).not.toContain("Mission & Values");
    expect(titles).not.toContain("Imagery");
  });

  test("bookmarks the Color Usage page after the palette unless it is switched off", async () => {
    const titles = async (excluded: string[]) =>
      outlineItems((await book(excluded)).pdf).map((item) =>
        item.lookup(PDFName.of("Title"), PDFHexString).decodeText(),
      );
    const all = await titles([]);
    expect(all[all.indexOf("Color Palette") + 1]).toBe("Color Usage");
    expect(await titles(["color-usage"])).not.toContain("Color Usage");
  });

  test("links every contents entry on the Introduction page to its page", async () => {
    const { contents, pdf } = await book(["voice"]);
    const intro = pdf.getPage(contents.findIndex((entry) => entry.id === "introduction"));
    const annots = intro.node.Annots();
    const targets = (annots?.asArray() ?? []).map((ref) => {
      const annot = pdf.context.lookup(ref, PDFDict);
      expect(annot.get(PDFName.of("Subtype"))).toBe(PDFName.of("Link"));
      return pageIndex(pdf, annot.lookup(PDFName.of("Dest"), PDFArray));
    });
    // Every page but the cover, which the contents list leaves out.
    expect(targets).toEqual(contents.slice(1).map((entry) => entry.number - 1));
  });

  test("adds no links without an Introduction page", async () => {
    const { pdf } = await book(["introduction"]);
    expect(pdf.getPages().every((page) => !page.node.Annots())).toBe(true);
    expect(outlineItems(pdf)).toHaveLength(guidelinePages.length - 1);
  });
});
