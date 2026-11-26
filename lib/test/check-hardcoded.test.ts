import { describe, expect, test } from "vitest";

import { hardcodedIn, isEnglishText, ratchet } from "../../scripts/check-hardcoded.mjs";

describe("isEnglishText", () => {
  test("reads words a translator would translate", () => {
    expect(isEnglishText("Reset filters")).toBe(true);
    expect(isEnglishText("Download")).toBe(true);
  });

  test("skips numbers, symbols, single letters, names and code-like tokens", () => {
    for (const text of [
      "",
      "·",
      "12",
      "px",
      "A",
      "SVG",
      "SVG / PNG",
      "WebP",
      "--color-x",
      "oklch(0.5 0.1 20)",
      "a11y.report",
    ]) {
      expect(isEnglishText(text), text).toBe(false);
    }
  });
});

describe("hardcodedIn", () => {
  test("finds JSX text and the text attributes, with their lines", () => {
    const source = `export function A() {
  return (
    <div title="Close panel">
      <button aria-label="Clear search">x</button>
      <p>Nothing here yet.</p>
      <input placeholder={"Search fonts"} />
    </div>
  );
}`;
    expect(hardcodedIn("a.tsx", source)).toEqual([
      { line: 3, text: "Close panel", kind: "title" },
      { line: 4, text: "Clear search", kind: "aria-label" },
      { line: 5, text: "Nothing here yet.", kind: "text" },
      { line: 6, text: "Search fonts", kind: "placeholder" },
    ]);
  });

  test("leaves messages, variables, names and other attributes alone", () => {
    const source = `export function B({ t, label }) {
  return (
    <div className="flex items-center" data-testid="row" aria-label={t("x.y")} title={label}>
      <span>{t("a.b")}</span>
      <span>{label}</span>
      <span>PNG</span>
      <span>12</span>
    </div>
  );
}`;
    expect(hardcodedIn("b.tsx", source)).toEqual([]);
  });
});

describe("ratchet", () => {
  test("no change is no error", () => {
    expect(ratchet({ a: 3, b: 0 }, { a: 3 })).toEqual([]);
  });

  test("an increase is an error, and so is a folder that was not in the baseline", () => {
    expect(ratchet({ a: 4, c: 1 }, { a: 3 })).toEqual([
      { folder: "a", now: 4, was: 3, kind: "up" },
      { folder: "c", now: 1, was: 0, kind: "up" },
    ]);
  });

  test("a decrease is an error until the baseline is lowered, and a folder that reached zero shows too", () => {
    expect(ratchet({ a: 1 }, { a: 3, b: 2 })).toEqual([
      { folder: "a", now: 1, was: 3, kind: "down" },
      { folder: "b", now: 0, was: 2, kind: "down" },
    ]);
  });
});
