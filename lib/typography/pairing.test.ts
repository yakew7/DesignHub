import { describe, expect, test } from "vitest";

import catalog from "@/lib/typography/catalog.json";
import { curatedPairs, isBodyCandidate, randomPair, scoreBody, suggestBodies } from "@/lib/typography/pairing";
import type { FontFamily } from "@/types/typography";

const fonts = catalog as FontFamily[];
const byFamily = new Map(fonts.map((font) => [font.family, font]));

/** Small seeded PRNG (mulberry32) so random pairings are repeatable. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function font(family: string): FontFamily {
  const found = byFamily.get(family);
  if (!found) throw new Error(`${family} is not in the catalog`);
  return found;
}

describe("curatedPairs", () => {
  test.each(curatedPairs.map((pair) => [pair.heading, pair.body]))("%s + %s are in the catalog", (heading, body) => {
    expect(byFamily.has(heading)).toBe(true);
    expect(byFamily.has(body)).toBe(true);
  });

  test("never pairs a font with itself and has no duplicates", () => {
    const keys = curatedPairs.map((pair) => `${pair.heading}|${pair.body}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const pair of curatedPairs) expect(pair.heading).not.toBe(pair.body);
  });
});

describe("isBodyCandidate", () => {
  test("needs a text category, a regular and a bold weight", () => {
    expect(isBodyCandidate(font("Inter"))).toBe(true);
    expect(isBodyCandidate(font("Pacifico"))).toBe(false);
    const thin: FontFamily = { family: "Thin", category: "sans-serif", weights: [100, 400], italic: false, rank: 1 };
    expect(isBodyCandidate(thin)).toBe(false);
  });
});

describe("suggestBodies", () => {
  test("never suggests the heading font itself", () => {
    for (const heading of fonts.slice(0, 200)) {
      const families = suggestBodies(heading, fonts).map((item) => item.family);
      expect(families).not.toContain(heading.family);
    }
  });

  test("excludes the heading even when there are few candidates", () => {
    const pool = [font("Inter"), font("Roboto")];
    expect(suggestBodies(font("Inter"), pool).map((item) => item.family)).toEqual(["Roboto"]);
  });

  test("respects the limit and only returns body candidates", () => {
    const suggestions = suggestBodies(font("Playfair Display"), fonts, 4);
    expect(suggestions).toHaveLength(4);
    expect(suggestions.every(isBodyCandidate)).toBe(true);
  });

  test("scores a sans body above a serif body under a serif heading", () => {
    const heading = font("Playfair Display");
    expect(scoreBody(heading, font("Inter"))).toBeGreaterThan(scoreBody(heading, font("Lora")));
    expect(scoreBody(font("Inter"), font("Inter"))).toBe(-Infinity);
  });
});

describe("randomPair", () => {
  const current = { heading: "Playfair Display", body: "Inter" };

  test("never pairs a font with itself", () => {
    const random = seeded(1);
    for (let index = 0; index < 300; index++) {
      const pair = randomPair(fonts, current, { heading: false, body: false }, random);
      expect(pair.heading).not.toBe(pair.body);
    }
  });

  test("keeps a locked heading", () => {
    const random = seeded(2);
    for (let index = 0; index < 100; index++) {
      const pair = randomPair(fonts, current, { heading: true, body: false }, random);
      expect(pair.heading).toBe("Playfair Display");
      expect(pair.body).not.toBe("Playfair Display");
    }
  });

  test("keeps a locked body and never draws it as the heading", () => {
    const random = seeded(3);
    const locked = { heading: "Lora", body: "Roboto" };
    for (let index = 0; index < 300; index++) {
      const pair = randomPair(fonts, locked, { heading: false, body: true }, random);
      expect(pair.body).toBe("Roboto");
      expect(pair.heading).not.toBe("Roboto");
    }
  });

  test("keeps both sides when both are locked", () => {
    expect(randomPair(fonts, current, { heading: true, body: true }, seeded(4))).toEqual(current);
  });

  test("returns the current pair when a locked heading is unknown", () => {
    const unknown = { heading: "Not A Font", body: "Inter" };
    expect(randomPair(fonts, unknown, { heading: true, body: false }, seeded(5))).toBe(unknown);
  });

  test("draws unlocked headings from popular, non-monospace families", () => {
    const random = seeded(6);
    for (let index = 0; index < 100; index++) {
      const heading = font(randomPair(fonts, current, { heading: false, body: false }, random).heading);
      expect(heading.rank).toBeLessThanOrEqual(150);
      expect(heading.category).not.toBe("monospace");
    }
  });
});
