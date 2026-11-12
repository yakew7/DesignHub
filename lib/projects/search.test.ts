import { describe, expect, test } from "vitest";

import { filterSorted, matchesProject, PROJECT_PAGE, searchText } from "@/lib/projects/search";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { projectSorts, sortProjects } from "@/lib/projects/sort";
import type { BrandProject, ProjectListItem } from "@/lib/projects/types";

const project = (name: string, tags: string[] = []): BrandProject => ({
  id: name,
  favorite: false,
  tags,
  createdAt: 0,
  updatedAt: 0,
  lastOpenedAt: 0,
  snapshot: defaultSnapshot(name),
});

describe("matchesProject", () => {
  test("matches a word of the name, in any case", () => {
    expect(matchesProject(project("Acme Labs"), "acme")).toBe(true);
    expect(matchesProject(project("Acme Labs"), "LABS")).toBe(true);
    expect(matchesProject(project("Acme Labs"), "zeta")).toBe(false);
  });

  test("matches a tag, and a name and a tag together", () => {
    const acme = project("Acme Labs", ["client", "archived"]);
    expect(matchesProject(acme, "client")).toBe(true);
    expect(matchesProject(acme, "acme archived")).toBe(true);
    expect(matchesProject(acme, "acme draft")).toBe(false);
  });

  test("an empty search matches everything", () => {
    expect(matchesProject(project("Acme"), "   ")).toBe(true);
  });

  test("the first page is a screenful, not the whole list", () => {
    expect(PROJECT_PAGE).toBeGreaterThan(0);
    expect(PROJECT_PAGE).toBeLessThanOrEqual(36);
  });
});

describe("filterSorted on 5,000 projects (#546)", () => {
  // A fixed sequence, so a failure can be read again.
  let seed = 7;
  const next = (limit: number) => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return seed % limit;
  };
  const words = ["Acme", "Labs", "Zeta", "Studio", "North", "Brand", "Café", "Orbit"];
  const tagPool = ["client", "archived", "draft", "internal"];
  const items: ProjectListItem[] = Array.from({ length: 5000 }, (_, index) => ({
    id: `p${index}`,
    name: `${words[next(words.length)]} ${words[next(words.length)]} ${index}`,
    favorite: next(10) === 0,
    tags: tagPool.filter(() => next(4) === 0),
    createdAt: next(1_000_000),
    updatedAt: next(1_000_000),
    lastOpenedAt: next(1_000_000),
  }));
  const texts = new Map(items.map((item) => [item.id, searchText(item)]));

  test.each(
    projectSorts.flatMap((sort) =>
      ["", "acme", "studio 12", "client", "café orbit"].map((search) => [sort, search] as const),
    ),
  )("%s, %j: the same projects in the same order as filtering, then sorting", (sort, search) => {
    for (const [favoritesOnly, tag] of [
      [false, null],
      [true, null],
      [false, "client"],
    ] as const) {
      const expected = sortProjects(
        items.filter(
          (item) =>
            (!favoritesOnly || item.favorite) && (!tag || item.tags.includes(tag)) && matchesProject(item, search),
        ),
        sort,
      );
      const got = filterSorted(sortProjects(items, sort), texts, { search, favoritesOnly, tag });
      expect(got.map((item) => item.id)).toEqual(expected.map((item) => item.id));
    }
  });
});
