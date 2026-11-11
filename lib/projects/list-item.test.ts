import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { listItemOf, LIST_COLORS, projectName, type BrandProject } from "@/lib/projects/types";

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

  test("keeps at most six colors, as hex", () => {
    const item = listItemOf(project);
    expect(item.colors.length).toBeLessThanOrEqual(LIST_COLORS);
    expect(item.colors.length).toBe(Math.min(LIST_COLORS, project.snapshot.colors.swatches.length));
    for (const hex of item.colors) expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("names the project the same as the project is named", () => {
    expect(projectName(listItemOf(project))).toBe(projectName(project));
    expect(projectName({ name: "   " })).toBe("Untitled brand");
  });
});
