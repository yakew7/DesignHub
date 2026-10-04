import { expect, test } from "vitest";

import { defaultSnapshot } from "@/lib/projects/snapshot";
import { addTag, MAX_PROJECT_TAGS, projectTags, removeTag } from "@/lib/projects/tags";
import type { BrandProject } from "@/lib/projects/types";

test("adding a tag normalizes it and skips duplicates", () => {
  expect(addTag([], "  Client  Work ")).toEqual(["client work"]);
  expect(addTag(["client"], "CLIENT")).toEqual(["client"]);
  expect(addTag(["client"], "   ")).toEqual(["client"]);
});

test("a project holds at most five tags", () => {
  const full = ["a", "b", "c", "d", "e"];
  expect(full).toHaveLength(MAX_PROJECT_TAGS);
  expect(addTag(full, "f")).toEqual(full);
  expect(removeTag(full, "c")).toEqual(["a", "b", "d", "e"]);
});

test("the filter lists every tag in use once, A to Z", () => {
  const make = (id: string, tags: string[]): BrandProject => ({
    id,
    favorite: false,
    tags,
    createdAt: 0,
    updatedAt: 0,
    lastOpenedAt: 0,
    snapshot: defaultSnapshot(id),
  });
  expect(projectTags([make("a", ["personal", "client"]), make("b", ["client", "archived"])])).toEqual([
    "archived",
    "client",
    "personal",
  ]);
});
