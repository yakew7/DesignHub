import { describe, expect, test } from "vitest";

import { contrastPairs } from "@/lib/a11y/contrast";
import { catalogs } from "@/lib/i18n/all-catalogs";
import { finishedLocales } from "@/lib/i18n/complete-areas";
import { locales } from "@/lib/i18n/locales";
import { en } from "@/lib/i18n/messages/en";
import { createTranslator } from "@/lib/i18n/translate";
import type { A11yTab } from "@/types/a11y";

/** The Accessibility Lab's interface text lives in the catalogs; these keys are the ones its components read. */
const tabs: A11yTab[] = ["contrast", "vision", "readability", "targets", "motion"];
const colorFields = ["text", "background", "accent", "onAccent"];

describe("Accessibility Lab messages", () => {
  test("every tab, color field and contrast pair has a message in English", () => {
    const keys = new Set(Object.keys(en));
    for (const tab of tabs) expect(keys.has(`a11y.tab.${tab}`), tab).toBe(true);
    for (const field of colorFields) expect(keys.has(`a11y.colors.${field}`), field).toBe(true);
    const ids = contrastPairs({ text: "#000000", background: "#ffffff", accent: "#336699", onAccent: "#ffffff" }).map(
      (pair) => pair.id,
    );
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(keys.has(`a11y.contrast.pair.${id}`), id).toBe(true);
  });

  test.each(locales)("%s fills the ratio and the suggestion without leftover placeholders", (locale) => {
    const { t } = createTranslator(catalogs[locale], locale);
    const ratio = t("a11y.contrast.ratio", { ratio: "4.52:1", required: 4.5 });
    expect(ratio).toContain("4.52:1");
    expect(ratio).toContain("4.5");
    expect(ratio).not.toMatch(/[{}]/);
    expect(t("a11y.contrast.apca", { lc: "-62.3", target: 75 })).not.toMatch(/[{}]/);
    expect(t("a11y.contrast.use", { color: "#1a56db" })).toContain("#1a56db");
  });

  test("the verdict words differ between pass, warning and fail in every language", () => {
    for (const locale of finishedLocales) {
      const words = ["pass", "warn", "fail"].map(
        (verdict) => catalogs[locale][`a11y.verdict.${verdict}` as keyof typeof en],
      );
      expect(new Set(words).size, locale).toBe(3);
    }
  });
});
