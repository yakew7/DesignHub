import { expect, test } from "vitest";

import { defaultSnapshot } from "@/lib/projects/snapshot";
import { sortProjects } from "@/lib/projects/sort";
import { listItemOf, projectName, type BrandProject, type ProjectListItem } from "@/lib/projects/types";

const make = (name: string, patch: Partial<BrandProject>): BrandProject => ({
  id: name,
  favorite: false,
  tags: [],
  createdAt: 0,
  updatedAt: 0,
  lastOpenedAt: 0,
  snapshot: defaultSnapshot(name),
  ...patch,
});

const projects = [
  make("beta", { createdAt: 3, updatedAt: 10, lastOpenedAt: 1 }),
  make("Alpha", { createdAt: 1, updatedAt: 30, lastOpenedAt: 3 }),
  make("gamma", { createdAt: 2, updatedAt: 20, lastOpenedAt: 2, favorite: true }),
];
const names = (list: BrandProject[]) => list.map(projectName);

test.each([
  ["opened", ["gamma", "Alpha", "beta"]],
  ["edited", ["gamma", "Alpha", "beta"]],
  ["name", ["gamma", "Alpha", "beta"]],
  ["newest", ["gamma", "beta", "Alpha"]],
  ["size", ["gamma", "beta", "Alpha"]],
] as const)("%s keeps favorites first", (sort, expected) => {
  expect(names(sortProjects(projects, sort))).toEqual(expected);
});

test("size sorts largest first, with unmeasured projects last", () => {
  const item = (name: string, sizeBytes?: number): ProjectListItem => ({ ...listItemOf(make(name)), sizeBytes });
  const items = [item("small", 100), item("big", 900), item("unmeasured"), item("mid", 500)];
  expect(names(sortProjects(items, "size"))).toEqual(["big", "mid", "small", "unmeasured"]);
});

test("name sorting ignores case", () => {
  const plain = projects.map((project) => ({ ...project, favorite: false }));
  expect(names(sortProjects(plain, "name"))).toEqual(["Alpha", "beta", "gamma"]);
});

test("does not mutate the input", () => {
  const copy = [...projects];
  sortProjects(projects, "name");
  expect(projects).toEqual(copy);
});
