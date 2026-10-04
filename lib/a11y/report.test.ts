import { describe, expect, test } from "vitest";

import { contrastSection, focusIndicatorCheck, focusSection } from "@/lib/a11y/contrast";
import { buildReport, contrastTable, focusTable, reportToMarkdown, type A11yReportInput } from "@/lib/a11y/report";
import { targetsSection } from "@/lib/a11y/targets";
import { visionSection } from "@/lib/a11y/vision";

const input: A11yReportInput = {
  colors: { text: "#111111", background: "#ffffff", accent: "#8ab4f8", onAccent: "#ffffff" },
  focusRing: "#6366f1",
  typography: {
    family: "Inter",
    size: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    wordSpacing: 0,
    weight: 400,
    measure: 640,
  },
  targets: [{ id: "a", label: "Icon | button", width: 20, height: 20 }],
  targetGap: 8,
};

const report = buildReport(input, {
  contrast: contrastSection(input.colors),
  focusIndicator: focusSection(focusIndicatorCheck(input.focusRing, input.colors.background, input.colors.accent)),
  vision: visionSection(input.colors),
  readability: { charactersPerLine: 70, readingEase: 64, gradeLevel: 8, checks: [] },
  touchTargets: targetsSection(input.targets, input.targetGap),
});

const rows = (markdown: string) => markdown.split("\n").map((line) => line.split(/(?<!\\)\|/).map((c) => c.trim()));

describe("contrastTable", () => {
  const section = report.sections.contrast;
  const lines = contrastTable(section).split("\n");

  test("is a GitHub table with a header, a divider and one row per pair", () => {
    expect(lines).toHaveLength(2 + section.length);
    expect(lines[1]).toMatch(/^\| (--- \| )+---\s\|$/);
    const columns = rows(lines[0])[0].length;
    for (const line of rows(lines.join("\n"))) expect(line).toHaveLength(columns);
  });

  test("shows the same ratio, AA/AAA marks and APCA Lc as the JSON", () => {
    section.forEach((pair, index) => {
      const [, check, colors, ratio, required, result, aa, aaLarge, aaa, aaaLarge, lc, apca] = rows(
        lines[index + 2],
      )[0];
      expect(check).toBe(pair.check);
      expect(colors).toBe(`\`${pair.foreground}\` on \`${pair.background}\``);
      expect(ratio).toBe(`${pair.ratio.toFixed(2)}:1`);
      expect(required).toBe(`${pair.required.toFixed(2)}:1`);
      expect(result.startsWith(pair.pass ? "✅ Pass" : "❌ Fail")).toBe(true);
      expect(aa).toBe(pair.wcag.AA ? "✅ Pass" : "❌ Fail");
      expect(aaLarge).toBe(pair.wcag["AA large"] ? "✅ Pass" : "❌ Fail");
      expect(aaa).toBe(pair.wcag.AAA ? "✅ Pass" : "❌ Fail");
      expect(aaaLarge).toBe(pair.wcag["AAA large"] ? "✅ Pass" : "❌ Fail");
      expect(lc).toBe(`${pair.apca.lc} (min ${pair.apca.target})`);
      expect(apca).toBe(pair.apca.pass ? "✅ Pass" : "❌ Fail");
    });
  });

  test("marks a failing pair and its suggested fix", () => {
    const failing = section.find((pair) => !pair.pass);
    expect(failing?.suggestion).toBeTruthy();
    expect(contrastTable(section)).toContain(`❌ Fail (try \`${failing?.suggestion}\`)`);
  });
});

describe("focusTable", () => {
  test("shows both ring ratios and the verdict from the JSON", () => {
    const focus = report.sections.focusIndicator;
    const [, check, ring, background, component, required, result] = rows(focusTable(focus).split("\n")[2])[0];
    expect(check).toBe(focus.check);
    expect(ring).toBe("`#6366f1`");
    expect(background).toBe(`${focus.ratioAgainstBackground.toFixed(2)}:1 on \`#ffffff\``);
    expect(component).toBe(`${focus.ratioAgainstComponent.toFixed(2)}:1 on \`#8ab4f8\``);
    expect(required).toBe("3.00:1");
    expect(result.startsWith(focus.pass ? "✅ Pass" : "❌ Fail")).toBe(true);
  });
});

describe("reportToMarkdown", () => {
  const markdown = reportToMarkdown({ ...report, generatedAt: "2026-01-01T00:00:00.000Z" });

  test("has a heading per section", () => {
    const headings = markdown.split("\n").filter((line) => line.startsWith("#"));
    expect(headings).toEqual([
      "# Accessibility report",
      "## Settings",
      "## Contrast",
      "## Focus indicator",
      "## Color vision",
      "## Readability",
      "## Touch targets",
    ]);
    expect(markdown).toContain("2026-01-01T00:00:00.000Z");
  });

  test("escapes pipes so labels cannot break a table", () => {
    expect(markdown).toContain("Icon \\| button");
  });
});
