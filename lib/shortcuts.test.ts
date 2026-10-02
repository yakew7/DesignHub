import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "vitest";

import { studios } from "@/lib/navigation";
import { shortcuts } from "@/lib/shortcuts";

/** Every `| keys | action |` row of the shortcuts guide, as "keys: action". */
function guideRows(): string[] {
  const guide = readFileSync(join(__dirname, "..", "docs", "shortcuts.md"), "utf8");
  return guide
    .split("\n")
    .map((line) => line.match(/^\|\s*(`.+?`)\s*\|\s*(.+?)\s*\|$/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map(([, keys, action]) => `${keys?.replace(/\s+/g, " ")}: ${action}`);
}

test("every studio has its own go-to letter", () => {
  const letters = studios.map((studio) => studio.shortcut);
  expect(new Set(letters).size).toBe(letters.length);
  expect(letters).not.toContain("h");
});

test("docs/shortcuts.md lists every shortcut in the dialog, and nothing else", () => {
  const expected = shortcuts.map((item) => `${item.keys.map((key) => `\`${key}\``).join(" ")}: ${item.description}`);
  expect(guideRows().sort()).toEqual(expected.sort());
});
