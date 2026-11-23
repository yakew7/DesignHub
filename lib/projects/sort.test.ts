import { describe, expect, test } from "vitest";

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

describe("size", () => {
  const item = (name: string, bytes: number, patch: Partial<ProjectListItem> = {}): ProjectListItem => ({
    ...listItemOf(make(name, {})),
    bytes,
    ...patch,
  });
  const list = [
    item("small", 1_000),
    item("large", 90_000),
    item("tie older", 5_000, { updatedAt: 1 }),
    item("tie newer", 5_000, { updatedAt: 2 }),
    item("starred", 10, { favorite: true }),
  ];
  const listNames = (items: ProjectListItem[]) => items.map(projectName);

  test("puts the largest first, the most recently edited first among equals, and favorites before all", () => {
    expect(listNames(sortProjects(list, "size"))).toEqual(["starred", "large", "tie newer", "tie older", "small"]);
  });

  test("measures a whole project that carries no size", () => {
    const plain = [make("tiny", {}), make("big", {})];
    plain[1]!.snapshot.brand.profile.mission.statement = "x".repeat(200);
    expect(names(sortProjects(plain, "size"))).toEqual(["big", "tiny"]);
  });
});
