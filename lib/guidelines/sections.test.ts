import { describe, expect, test } from "vitest";

import { brandMarkdownFiles, MARKDOWN_FILENAME } from "@/lib/guidelines/markdown";
import { guidelinePages } from "@/lib/guidelines/registry";
import {
  groupPagesBySection,
  includedCount,
  isSectionOn,
  LOCKED_PAGE_ID,
  pageNumbers,
  setPagesIncluded,
  switchableIds,
} from "@/lib/guidelines/sections";
import { brandSiteFiles } from "@/lib/guidelines/site";
import { guidelineContext } from "@/lib/guidelines/test-context";
import { guidelineSections } from "@/lib/guidelines/types";

const groups = groupPagesBySection(guidelinePages);

/** The switched-off list a user gets from turning one whole section off. */
const sectionOff = (section: (typeof guidelineSections)[number]) => {
  const group = groups.find((item) => item.section === section)!;
  return { group, excluded: setPagesIncluded([], switchableIds(group.pages), false) };
};

describe("page sections", () => {
  test("every registered page has one of the known sections", () => {
    for (const page of guidelinePages) {
      expect(guidelineSections, `${page.id} has no section`).toContain(page.section);
    }
  });

  test("groups every page once, in section order, and no section is empty", () => {
    expect(groups.map((group) => group.section)).toEqual([...guidelineSections]);
    expect(groups.flatMap((group) => group.pages.map((page) => page.id)).sort()).toEqual(
      guidelinePages.map((page) => page.id).sort(),
    );
    for (const group of groups) expect(group.pages.length, group.section).toBeGreaterThan(0);
  });

  test("keeps the book order, so the numbers in the list read 1, 2, 3 from top to bottom", () => {
    const grouped = groups.flatMap((group) => group.pages.map((page) => page.id));
    expect(grouped).toEqual(guidelinePages.map((page) => page.id));
  });

  test("puts the cover in Foundation and the token pages in Tokens", () => {
    const ids = (section: string) => groups.find((group) => group.section === section)?.pages.map((page) => page.id);
    expect(ids("Foundation")).toEqual(["cover", "introduction", "mission"]);
    expect(ids("Tokens")).toEqual(["tokens-color", "tokens-scale"]);
  });

  test("leaves a page's running header label alone", () => {
    const { ctx, pages } = guidelineContext("Acme Labs", []);
    const page = pages.find((item) => item.id === "data-visualization")!;
    expect(page.section).toBe("Color");
    expect(page.render(ctx, 1)).toContain("DATA VISUALIZATION");
  });
});

describe("switching a section", () => {
  test("adds the section's pages to the switched-off list and keeps the other entries", () => {
    const logo = groups.find((group) => group.section === "Logo")!;
    const next = setPagesIncluded(["voice"], switchableIds(logo.pages), false);
    expect(next).toEqual(["voice", ...logo.pages.map((page) => page.id)]);
    expect(isSectionOn(logo.pages, next)).toBe(false);
    expect(includedCount(logo.pages, next)).toBe(0);
  });

  test("switching it back on removes only its pages and never doubles an entry", () => {
    const logo = groups.find((group) => group.section === "Logo")!;
    const ids = switchableIds(logo.pages);
    const off = setPagesIncluded(["voice", ids[0]!], ids, false);
    expect(new Set(off).size).toBe(off.length);
    expect(setPagesIncluded(off, ids, true)).toEqual(["voice"]);
  });

  test("a section with some pages off is on until the last page goes", () => {
    const logo = groups.find((group) => group.section === "Logo")!;
    const ids = switchableIds(logo.pages);
    expect(isSectionOn(logo.pages, ids.slice(0, ids.length - 1))).toBe(true);
    expect(includedCount(logo.pages, ids.slice(0, 2))).toBe(logo.pages.length - 2);
    expect(isSectionOn(logo.pages, ids)).toBe(false);
  });

  test("never switches the cover off, so Foundation keeps one page", () => {
    const { group, excluded } = sectionOff("Foundation");
    expect(excluded).not.toContain(LOCKED_PAGE_ID);
    expect(setPagesIncluded([], [LOCKED_PAGE_ID], false)).toEqual([]);
    expect(includedCount(group.pages, excluded)).toBe(1);
    expect(isSectionOn(group.pages, excluded)).toBe(false);
  });

  test("numbers follow the pages that are left", () => {
    const { excluded } = sectionOff("Logo");
    const numbers = pageNumbers(guidelinePages, excluded);
    const { ctx } = guidelineContext("Acme Labs", excluded);
    expect([...numbers.keys()]).toEqual(ctx.contents.map((entry) => entry.id));
    expect([...numbers.values()]).toEqual(ctx.contents.map((entry) => entry.number));
    expect([...numbers.values()]).toEqual(ctx.contents.map((_, i) => i + 1));
    expect(numbers.has("clear-space")).toBe(false);
  });
});

describe("a section that is off is left out of every export", () => {
  test.each(guidelineSections)("%s", (section) => {
    const { group, excluded } = sectionOff(section);
    const gone = switchableIds(group.pages);
    const { ctx, pages } = guidelineContext("Acme Labs", excluded);
    const kept = guidelinePages.length - gone.length;

    // The list the PDF, the website and the Markdown export all filter by.
    expect(pages).toHaveLength(kept);
    for (const id of gone) expect(pages.map((page) => page.id)).not.toContain(id);
    expect(ctx.contents.map((entry) => entry.number)).toEqual(pages.map((_, i) => i + 1));

    // Website: no page, no art, and no row in the contents.
    const site = new Map(brandSiteFiles(ctx, pages).map((entry) => [entry.name, String(entry.data)]));
    for (const id of gone) {
      expect(site.has(`${id}/index.html`), `${id} page in the website`).toBe(false);
      expect(site.has(`assets/pages/${id}.svg`), `${id} art in the website`).toBe(false);
    }
    for (const page of pages) expect(site.has("assets/pages/" + page.id + ".svg"), page.id).toBe(true);

    // Markdown: no heading and no art, and the headings still count 1, 2, 3.
    const markdown = new Map(brandMarkdownFiles(ctx, pages).map((entry) => [entry.name, String(entry.data)]));
    const md = markdown.get(MARKDOWN_FILENAME) ?? "";
    for (const id of gone) expect(markdown.has(`assets/pages/${id}.svg`), `${id} art in the Markdown`).toBe(false);
    for (const page of guidelinePages.filter((item) => gone.includes(item.id))) {
      expect(md, page.title).not.toContain(`. ${page.title}\n`);
    }
    const numbers = [...md.matchAll(/^## (\d+)\. /gm)].map((match) => Number(match[1]));
    expect(numbers).toEqual(Array.from({ length: kept }, (_, i) => i + 1));
  });
});
