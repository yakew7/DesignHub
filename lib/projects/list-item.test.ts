import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { listItemOf, projectBytes, projectName, type BrandProject } from "@/lib/projects/types";

const fixture = JSON.parse(readFileSync(join(__dirname, "__fixtures__/v1/projects.json"), "utf8")) as {
  projects: BrandProject[];
};
const project = {
  ...fixture.projects[0]!,
  id: "p1",
  favorite: true,
  tags: ["client"],
  createdAt: 1,
  updatedAt: 2,
  lastOpenedAt: 3,
} as BrandProject;

describe("a project's list item", () => {
  test("keeps the fields the list sorts, filters and searches on, and no snapshot", () => {
    const item = listItemOf(project);
    expect(item).not.toHaveProperty("snapshot");
    expect(item).toMatchObject({
      id: "p1",
      favorite: true,
      tags: ["client"],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastOpenedAt: project.lastOpenedAt,
      name: project.snapshot.brand.profile.name,
    });
  });

  test("keeps no colors: a card shows a plain box until its picture is drawn (#547)", () => {
    expect(listItemOf(project)).not.toHaveProperty("colors");
  });

  test("names the project the same as the project is named", () => {
    expect(projectName(listItemOf(project))).toBe(projectName(project));
    expect(projectName({ name: "   " })).toBe("Untitled brand");
  });

  test("keeps the size of the stored project in bytes, the same JSON the Storage panel measures", () => {
    const item = listItemOf(project);
    expect(item.bytes).toBe(new TextEncoder().encode(JSON.stringify(project)).length);
    expect(item.bytes).toBe(projectBytes(project));
    expect(item.bytes).toBeGreaterThan(1000);
  });

  test("grows with the project and counts what is not ASCII as the bytes it takes", () => {
    const longer = structuredClone(project);
    longer.snapshot.brand.profile.name = "Caf\u00e9 ".repeat(10);
    const plain = structuredClone(project);
    plain.snapshot.brand.profile.name = "Cafe ".repeat(10);
    // Ten accented letters are ten more bytes in UTF-8.
    expect(projectBytes(longer) - projectBytes(plain)).toBe(10);
    expect(listItemOf(longer).bytes).toBe(projectBytes(longer));
  });
});
