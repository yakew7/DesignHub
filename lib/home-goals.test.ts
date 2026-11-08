import { describe, expect, test } from "vitest";

import { homeGoals, orderGoals } from "@/lib/home-goals";
import { catalogs } from "@/lib/i18n/all-catalogs";
import { locales } from "@/lib/i18n/locales";
import { en } from "@/lib/i18n/messages/en";
import { getStudio, studios } from "@/lib/navigation";

describe("home goals", () => {
  test("are about eight, each with its own id", () => {
    expect(homeGoals.length).toBeGreaterThanOrEqual(6);
    expect(homeGoals.length).toBeLessThanOrEqual(10);
    expect(new Set(homeGoals.map((goal) => goal.id)).size).toBe(homeGoals.length);
  });

  test("every goal links to a real studio route", () => {
    const hrefs = new Set(studios.map((studio) => studio.href));
    for (const goal of homeGoals) expect(hrefs.has(getStudio(goal.studio).href), goal.id).toBe(true);
  });

  test("every goal has a title and a body in English and in every language", () => {
    for (const goal of homeGoals) {
      for (const part of ["title", "body"]) {
        const key = `home.goal.${goal.id}.${part}`;
        expect(Object.hasOwn(en, key), key).toBe(true);
        for (const locale of locales) expect(Object.hasOwn(catalogs[locale], key), `${locale} ${key}`).toBe(true);
      }
    }
  });

  test("the home page keeps the full list of studios reachable by a count in its label", () => {
    expect(en["home.allStudios"]).toContain("{count}");
  });
});

describe("orderGoals", () => {
  test("a first visit keeps the written order", () => {
    expect(orderGoals(null, []).map((goal) => goal.id)).toEqual(homeGoals.map((goal) => goal.id));
  });

  test("the last studio comes first, then the palette's studios newest first, then the rest in order", () => {
    const ids = orderGoals("typography", ["action:theme", "studio:icons", "studio:logo"]).map((goal) => goal.studio);
    expect(ids.slice(0, 3)).toEqual(["typography", "icons", "logo"]);
    expect(ids).toHaveLength(homeGoals.length);
    expect(ids.slice(3)).toEqual(
      homeGoals.map((goal) => goal.studio).filter((studio) => !ids.slice(0, 3).includes(studio)),
    );
  });

  test("a studio with no goal changes nothing", () => {
    expect(orderGoals("projects", []).map((goal) => goal.id)).toEqual(homeGoals.map((goal) => goal.id));
  });
});
