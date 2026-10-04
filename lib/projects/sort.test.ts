import { expect, test } from "vitest";

import { defaultSnapshot } from "@/lib/projects/snapshot";
import { sortProjects } from "@/lib/projects/sort";
import { projectName, type BrandProject } from "@/lib/projects/types";

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
] as const)("%s keeps favorites first", (sort, expected) => {
  expect(names(sortProjects(projects, sort))).toEqual(expected);
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
