import { describe, expect, test } from "vitest";

import {
  buildSprite,
  commitSymbolId,
  dedupeSpriteIds,
  spriteUsage,
  symbolId,
  symbolIdClashes,
  uniqueSymbolId,
  type SpriteItem,
} from "@/lib/svg/sprite";
import { xmlError } from "@/lib/test/xml";

const ids = (svg: string) => [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);

describe("symbolId", () => {
  test("turns spaces and punctuation into single hyphens", () => {
    expect(symbolId("arrow right.svg")).toBe("arrow-right");
    expect(symbolId("  check   mark  .svg")).toBe("check-mark");
    expect(symbolId("My Icon (1).svg")).toBe("my-icon-1");
  });

  test("lowercases and strips the extension in any case", () => {
    expect(symbolId("HomeIcon.SVG")).toBe("homeicon");
    expect(symbolId("ARROW_UP.svg")).toBe("arrow-up");
  });

  test("always starts with a letter", () => {
    expect(symbolId("123.svg")).toBe("icon-123");
    expect(symbolId("2x-logo.svg")).toBe("icon-2x-logo");
    expect(symbolId("!!!.svg")).toBe("icon-svg");
  });

  test("duplicate names get the same id, and uniqueSymbolId numbers them", () => {
    expect(symbolId("Star.svg")).toBe(symbolId("star.svg"));
    expect(uniqueSymbolId("star.svg", [])).toBe("star");
    expect(uniqueSymbolId("star.svg", ["star"])).toBe("star-2");
    expect(uniqueSymbolId("Star.svg", ["star", "star-2"])).toBe("star-3");
  });
});

describe("renaming a symbol", () => {
  const items: SpriteItem[] = [
    { id: "star", source: "<svg/>" },
    { id: "heart", source: "<svg/>" },
    { id: "star-2", source: "<svg/>" },
  ];

  test("commit slugs the name and numbers it past ids other symbols use", () => {
    expect(commitSymbolId(items, 1, "Star")).toBe("star-3");
    expect(commitSymbolId(items, 1, "star-2")).toBe("star-2-2");
    expect(commitSymbolId(items, 1, "Moon Big")).toBe("moon-big");
  });

  test("commit keeps a symbol's own id and ignores blank names", () => {
    expect(commitSymbolId(items, 0, "star")).toBe("star");
    expect(commitSymbolId(items, 2, "star-2")).toBe("star-2");
    expect(commitSymbolId(items, 1, "   ")).toBe("heart");
  });

  test("committed ids are always unique", () => {
    let sprite = [...items];
    for (const [index, name] of [
      [1, "star"],
      [0, "star-3"],
      [2, "STAR"],
    ] as const) {
      const id = commitSymbolId(sprite, index, name);
      sprite = sprite.map((item, i) => (i === index ? { ...item, id } : item));
      expect(new Set(sprite.map((item) => item.id)).size).toBe(sprite.length);
    }
  });

  test("partial names never clash mid-word, the full clash is reported", () => {
    expect(["s", "st", "sta"].map((name) => symbolIdClashes(items, 1, name))).toEqual([false, false, false]);
    expect(symbolIdClashes(items, 1, "star")).toBe(true);
    expect(symbolIdClashes(items, 0, "star")).toBe(false);
    expect(symbolIdClashes(items, 1, "")).toBe(false);
  });

  test("dedupeSpriteIds renumbers repeats from older saves", () => {
    const saved = [
      { id: "star", source: "a" },
      { id: "star", source: "b" },
      { id: "star-2", source: "c" },
    ];
    expect(dedupeSpriteIds(saved).map((item) => item.id)).toEqual(["star", "star-3", "star-2"]);
    expect(dedupeSpriteIds(items)).toEqual(items);
  });
});

describe("buildSprite", () => {
  const icon = (color: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="g"><stop offset="0" stop-color="${color}"/></linearGradient><clipPath id="c-g"><rect width="24" height="24"/></clipPath></defs><g clip-path="url(#c-g)"><rect fill="url(#g)" width="24" height="24"/></g><use href="#g"/></svg>`;

  test("ids inside two symbols never collide", () => {
    const sprite = buildSprite([
      { id: "one", source: icon("#abc") },
      { id: "two", source: icon("#def") },
    ]);
    const all = ids(sprite);
    expect(all).toEqual(expect.arrayContaining(["one", "two", "one_g", "two_g", "one_c-g", "two_c-g"]));
    expect(new Set(all).size).toBe(all.length);
    expect(sprite).toContain("url(#one_c-g)");
    expect(sprite).toContain('href="#two_g"');
  });

  test("hyphenated symbol and internal ids can't combine into the same id", () => {
    // "a" + "b-c" and "a-b" + "c" would both be "a-b-c" with a hyphen separator.
    const items: SpriteItem[] = [
      { id: "a", source: '<svg viewBox="0 0 4 4"><path id="b-c" d="M0 0h4"/></svg>' },
      { id: "a-b", source: '<svg viewBox="0 0 4 4"><path id="c" d="M0 0h4"/></svg>' },
      { id: "a-b-c", source: '<svg viewBox="0 0 4 4"><path d="M0 0h4"/></svg>' },
    ];
    const all = ids(buildSprite(items));
    expect(new Set(all).size).toBe(all.length);
  });

  test("is well-formed XML, pretty or minified", () => {
    const items: SpriteItem[] = [
      { id: "one", source: icon("#abc") },
      { id: "two", source: '<svg width="16" height="16"><title>A &amp; B</title><circle r="4"/></svg>' },
    ];
    for (const pretty of [true, false]) {
      const sprite = buildSprite(items, pretty);
      expect(xmlError(sprite)).toBeNull();
      expect(sprite.match(/<symbol\b/g)).toHaveLength(2);
    }
    expect(xmlError(buildSprite([]))).toBeNull();
  });

  test("keeps the viewBox or falls back to width and height", () => {
    const sprite = buildSprite([
      { id: "boxed", source: '<svg viewBox="0 0 10 20"><rect/></svg>' },
      { id: "sized", source: '<svg width="16" height="32"><rect/></svg>' },
    ]);
    expect(sprite).toMatch(/<symbol id="boxed" viewBox="0 0 10 20"/);
    expect(sprite).toMatch(/<symbol id="sized" viewBox="0 0 16 32"/);
  });

  test("skips sources that don't parse", () => {
    const sprite = buildSprite([
      { id: "ok", source: '<svg viewBox="0 0 4 4"><rect/></svg>' },
      { id: "broken", source: "not svg" },
    ]);
    expect(sprite).toContain('id="ok"');
    expect(sprite).not.toContain('id="broken"');
  });
});

describe("spriteUsage", () => {
  test("references the first symbol and lists them all", () => {
    const usage = spriteUsage([
      { id: "home", source: "" },
      { id: "star", source: "" },
    ]);
    expect(usage).toContain('<use href="#home" />');
    expect(usage).toContain('<use href="/sprite.svg#home" />');
    expect(usage).toContain("Symbols: home, star");
  });

  test("falls back to a placeholder id when empty", () => {
    expect(spriteUsage([])).toContain('<use href="#icon" />');
  });
});
