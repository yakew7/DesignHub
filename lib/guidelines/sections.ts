import { guidelineSections, type GuidelinePage, type GuidelineSection } from "@/lib/guidelines/types";

/** The cover is always in the book, so neither it nor its section can switch it off. */
export const LOCKED_PAGE_ID = "cover";

export type SectionGroup = { section: GuidelineSection; pages: GuidelinePage[] };

/** The pages by section, in section order. Pages keep their book order inside a section. */
export function groupPagesBySection(pages: GuidelinePage[]): SectionGroup[] {
  return guidelineSections
    .map((section) => ({ section, pages: pages.filter((page) => page.section === section) }))
    .filter((group) => group.pages.length > 0);
}

/** The ids a switch can turn off. */
export function switchableIds(pages: GuidelinePage[]): string[] {
  return pages.filter((page) => page.id !== LOCKED_PAGE_ID).map((page) => page.id);
}

/** How many of the pages are in the book. */
export function includedCount(pages: GuidelinePage[], excluded: string[]): number {
  return pages.filter((page) => !excluded.includes(page.id)).length;
}

/** A section's switch is on while any page it can turn off is in the book. */
export function isSectionOn(pages: GuidelinePage[], excluded: string[]): boolean {
  return switchableIds(pages).some((id) => !excluded.includes(id));
}

/**
 * The switched-off list after turning `ids` on or off. Every other entry stays, and the cover is
 * never added. The PDF, the website and the Markdown export all read this list, so a section that
 * is off here is off in all three.
 */
export function setPagesIncluded(excluded: string[], ids: string[], included: boolean): string[] {
  const target = ids.filter((id) => id !== LOCKED_PAGE_ID);
  const rest = excluded.filter((id) => !target.includes(id));
  return included ? rest : [...rest, ...target];
}

/** Each included page's number in the book (switched-off pages have none). */
export function pageNumbers(pages: GuidelinePage[], excluded: string[]): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const page of pages) {
    if (!excluded.includes(page.id)) numbers.set(page.id, numbers.size + 1);
  }
  return numbers;
}
