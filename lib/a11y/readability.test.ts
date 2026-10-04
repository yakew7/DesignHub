import { describe, expect, test } from "vitest";

import { countSyllables, readabilityChecks, readingScore, scrambleWord } from "@/lib/a11y/readability";
import type { A11yTypography } from "@/types/a11y";

/** Small seeded PRNG (mulberry32) so shuffles are repeatable. */
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

describe("countSyllables", () => {
  test.each([
    ["the", 1],
    ["a", 1],
    ["table", 2],
    ["cake", 1],
    ["walked", 1],
    ["yellow", 2],
    ["lazy", 2],
    ["readability", 5],
    ["Hello,", 2],
  ])("%s has %i syllables", (word, expected) => {
    expect(countSyllables(word)).toBe(expected);
  });

  test("ignores words with no letters", () => {
    expect(countSyllables("")).toBe(0);
    expect(countSyllables("42!")).toBe(0);
  });
});

describe("readingScore", () => {
  test("matches the Flesch formula for a known sentence", () => {
    // 9 words, 1 sentence, 11 syllables: 206.835 - 1.015 * 9 - 84.6 * 11 / 9 = 94.3
    const score = readingScore("The quick brown fox jumps over the lazy dog.");
    expect(score.words).toBe(9);
    expect(score.sentences).toBe(1);
    expect(Math.abs(score.ease - 94.3)).toBeLessThanOrEqual(1);
    // 0.39 * 9 + 11.8 * 11 / 9 - 15.59 = 2.3
    expect(score.grade).toBeCloseTo(2.3, 1);
    expect(score.band).toBe("Easy");
  });

  test("counts sentences and rates long words as harder", () => {
    const plain = readingScore("The cat sat. The dog ran! Did it stop?");
    expect(plain.sentences).toBe(3);
    const dense = readingScore(
      "Organizational accountability necessitates comprehensive institutional documentation and considerable interdepartmental communication.",
    );
    expect(dense.ease).toBeLessThan(plain.ease);
    expect(dense.band).toBe("Very difficult");
  });

  test("handles empty text without dividing by zero", () => {
    const score = readingScore("");
    expect(score.words).toBe(0);
    expect(score.sentences).toBe(1);
    expect(Number.isFinite(score.ease)).toBe(true);
    expect(score.grade).toBeGreaterThanOrEqual(0);
  });
});

describe("readabilityChecks", () => {
  const typography: A11yTypography = {
    family: "Inter",
    size: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    wordSpacing: 0,
    weight: 400,
    measure: 640,
  };
  const easy = readingScore("The quick brown fox jumps over the lazy dog.");
  const verdicts = (checks: ReturnType<typeof readabilityChecks>) =>
    Object.fromEntries(checks.map((check) => [check.id, check.verdict]));

  test("passes comfortable body text", () => {
    expect(verdicts(readabilityChecks(typography, 60, easy))).toEqual({
      size: "pass",
      "line-height": "pass",
      measure: "pass",
      spacing: "pass",
      "reading-ease": "pass",
    });
  });

  test("warns and fails at the documented thresholds", () => {
    const small = { ...typography, size: 12, lineHeight: 1.3, letterSpacing: 0.2 };
    expect(verdicts(readabilityChecks(small, 40, easy))).toMatchObject({
      size: "warn",
      "line-height": "warn",
      measure: "warn",
      spacing: "warn",
    });
    const tiny = { ...typography, size: 11, lineHeight: 1.2 };
    const hard = { ...easy, ease: 20 };
    expect(verdicts(readabilityChecks(tiny, 120, hard))).toMatchObject({
      size: "fail",
      "line-height": "fail",
      measure: "fail",
      "reading-ease": "fail",
    });
  });
});

describe("scrambleWord", () => {
  test("keeps the first and last letters and the same letters overall", () => {
    const word = "readability";
    const scrambled = scrambleWord(word, seeded(1));
    expect(scrambled).toHaveLength(word.length);
    expect(scrambled[0]).toBe("r");
    expect(scrambled.at(-1)).toBe("y");
    expect([...scrambled].sort().join("")).toBe([...word].sort().join(""));
  });

  test("is deterministic with a seeded random", () => {
    expect(scrambleWord("typography", seeded(42))).toBe(scrambleWord("typography", seeded(42)));
    const outputs = new Set([1, 2, 3, 4, 5].map((seed) => scrambleWord("typography", seeded(seed))));
    expect(outputs.size).toBeGreaterThan(1);
  });

  test("leaves short words alone", () => {
    expect(scrambleWord("the", seeded(1))).toBe("the");
    expect(scrambleWord("a", () => 0.5)).toBe("a");
  });
});
