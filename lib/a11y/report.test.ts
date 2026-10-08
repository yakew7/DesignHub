import { describe, expect, test } from "vitest";

import { contrastSection, focusIndicatorCheck, focusSection } from "@/lib/a11y/contrast";
import { gradientSection, gradientTextColors, gradientTextContrast } from "@/lib/a11y/gradient-contrast";
import {
  buildReport,
  contrastTable,
  focusTable,
  gradientTable,
  paletteVisionTable,
  reportToMarkdown,
  type A11yReportInput,
} from "@/lib/a11y/report";
import { targetsSection } from "@/lib/a11y/targets";
import { paletteVisionSection, visionSection } from "@/lib/a11y/vision";
import { defaultGradient } from "@/lib/color/gradient";

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
  palette: [
    { name: "Red", hex: "#e53935" },
    { name: "Green", hex: "#43a047" },
    { name: "Blue", hex: "#1e88e5" },
  ],
};

const report = buildReport(input, {
  contrast: contrastSection(input.colors),
  focusIndicator: focusSection(focusIndicatorCheck(input.focusRing, input.colors.background, input.colors.accent)),
  gradientText: gradientSection(defaultGradient, gradientTextContrast(defaultGradient, gradientTextColors("#1f2937"))),
  vision: visionSection(input.colors),
  paletteVision: paletteVisionSection(input.palette),
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

describe("gradientTable", () => {
  test("has one row per text color with the worst ratio and where it is", () => {
    const section = report.sections.gradientText;
    const lines = gradientTable(section).split("\n");
    expect(lines).toHaveLength(2 + 3);
    section.results.forEach((item, index) => {
      const [, text, worst, where, background, required, result] = rows(lines[index + 2])[0];
      expect(text).toBe(`${item.text} \`${item.color}\``);
      expect(worst).toBe(`${item.worstRatio.toFixed(2)}:1`);
      expect(where).toBe(`${item.worstPosition}%`);
      expect(background).toBe(`\`${item.worstBackground}\``);
      expect(required).toBe("4.50:1");
      expect(result).toBe(item.pass ? "✅ Pass" : "❌ Fail");
    });
  });
});

describe("paletteVisionTable", () => {
  test("lists each confusable pair with the same numbers as the JSON", () => {
    const section = report.sections.paletteVision;
    const pairs = section.modes.flatMap((mode) => mode.pairs.map((pair) => ({ mode: mode.mode, pair })));
    const lines = paletteVisionTable(section).split("\n");
    expect(lines).toHaveLength(2 + pairs.length);
    const deuteranopia = pairs.findIndex(({ mode }) => mode === "deuteranopia");
    expect(deuteranopia).toBeGreaterThanOrEqual(0);
    const { pair } = pairs[deuteranopia];
    const [, mode, colors, distance, typical, required, result, suggestion] = rows(lines[deuteranopia + 2])[0];
    expect(mode).toBe("deuteranopia");
    expect(colors).toBe("Red `#e53935` and Green `#43a047`");
    expect(distance).toBe(pair.distance.toFixed(3));
    expect(typical).toBe(pair.typicalDistance.toFixed(3));
    expect(required).toBe("0.060");
    expect(result).toBe("❌ Fail");
    expect(suggestion).toBe(
      `Change ${pair.suggestion?.color} to \`${pair.suggestion?.to}\` (${pair.suggestion?.distance.toFixed(3)})`,
    );
  });

  test("the JSON report carries the check", () => {
    const json = JSON.parse(JSON.stringify(report));
    expect(json.sections.paletteVision.threshold).toBe(0.06);
    expect(json.sections.paletteVision.pass).toBe(false);
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
      "## Text on the brand gradient",
      "## Color vision",
      "## Palette under color vision",
      "## Readability",
      "## Touch targets",
    ]);
    expect(markdown).toContain("2026-01-01T00:00:00.000Z");
  });

  test("escapes pipes so labels cannot break a table", () => {
    expect(markdown).toContain("Icon \\| button");
  });
});
