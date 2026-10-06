import { describe, expect, test } from "vitest";

import { googleFontsCssUrl } from "@/lib/typography/google-fonts";
import { matchSample, needsExtendedGlyphs, specimenSamples } from "@/lib/typography/samples";
import type { FontFamily } from "@/types/typography";

const inter: FontFamily = {
  family: "Inter",
  category: "sans-serif",
  weights: [400, 700],
  italic: false,
  axes: [{ tag: "wght", min: 100, max: 900, default: 400 }],
  rank: 1,
};

function textParam(url: string): string | null {
  return new URL(url).searchParams.get("text");
}

describe("specimen samples", () => {
  test("have unique ids and non-empty text", () => {
    expect(new Set(specimenSamples.map((sample) => sample.id)).size).toBe(specimenSamples.length);
    for (const sample of specimenSamples) expect(sample.text.trim()).not.toBe("");
  });

  test("cover the languages and scripts from the menu", () => {
    const text = (id: string) => specimenSamples.find((sample) => sample.id === id)?.text ?? "";
    expect(text("spanish")).toMatch(/[ñ¿¡]/);
    expect(text("german")).toMatch(/[ßÜ]/);
    expect(text("vietnamese")).toMatch(/[ểĐ]/);
    expect(text("greek")).toMatch(/[Ͱ-Ͽ]/);
    expect(text("cyrillic")).toMatch(/[Ѐ-ӿ]/);
    expect(text("numbers")).toMatch(/0123456789/);
  });

  test("match the text exactly and stop matching once edited", () => {
    const greek = specimenSamples.find((sample) => sample.id === "greek")!;
    expect(matchSample(greek.text)?.id).toBe("greek");
    expect(matchSample(`${greek.text}!`)).toBeUndefined();
  });

  test("flag text outside basic Latin", () => {
    expect(needsExtendedGlyphs("The quick brown fox")).toBe(false);
    expect(needsExtendedGlyphs("größeren")).toBe(true);
  });

  test("the specimen request loads every subset the family has", () => {
    // Without `text=` Google serves one @font-face per subset with a unicode-range,
    // so any script the family supports is downloaded when it appears.
    expect(textParam(googleFontsCssUrl(inter))).toBeNull();
  });

  test("a text= subset keeps every glyph of each sample", () => {
    for (const sample of specimenSamples) {
      expect(textParam(googleFontsCssUrl(inter, { text: sample.text, weight: 400 }))).toBe(sample.text);
    }
  });
});
