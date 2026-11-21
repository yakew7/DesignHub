import { expect, test } from "@playwright/test";

import { catalogs } from "../../lib/i18n/all-catalogs";
import { en } from "../../lib/i18n/messages/en";
import { studios } from "../../lib/navigation";
import { hydrated } from "./storage";

/**
 * A translated studio should have no English left, on its first view and on each of its tabs. Every studio is opened
 * in Spanish, French and Hindi, and the visible text of its buttons, tabs, labels and headings, and the aria-label,
 * title and placeholder of what is on screen, must not equal the English text of a key that
 * has a different translation in that language. The failure names the studio, the text and the key.
 */
const LANGUAGES = ["es", "fr", "hi"] as const;

/** Text that is the same in a language on purpose. Each entry says why. */
const ALLOWED: readonly { text: string; languages: readonly string[]; reason: string }[] = [
  { text: "Material", languages: ["hi"], reason: "the Material Design icon set, a name" },
  { text: "Plus", languages: ["fr"], reason: 'the French word "plus" (more), spelled like the English generator name' },
];

/**
 * English found when this test was added, by studio, with the issue that tracks it. Remove an entry once it is
 * translated. Studio headings are checked against their catalog entries below.
 */
const KNOWN: Readonly<Record<string, { issue: number; texts: readonly string[] }>> = {};

type Pattern = { keys: string[]; match: RegExp };

/** The English messages that this language translates differently, as whole-text patterns. */
function englishLeftPatterns(language: (typeof LANGUAGES)[number]): Pattern[] {
  const catalog: Record<string, string | undefined> = catalogs[language];
  const byText = new Map<string, string[]>();
  // Text that some key keeps as it is in this language ("Export" in French) is correct there.
  const kept = new Set(
    Object.entries(en)
      .filter(([key, english]) => catalog[key] === english)
      .map(([, english]) => english),
  );
  for (const [key, english] of Object.entries(en)) {
    const translated = catalog[key];
    if (translated === undefined || translated === english || kept.has(english)) continue;
    // A message that is mostly placeholders would match almost anything.
    if (english.replace(/\{\w+\}/g, "").replace(/[^\p{L}]/gu, "").length < 2) continue;
    byText.set(english, [...(byText.get(english) ?? []), key]);
  }
  return [...byText].map(([english, keys]) => {
    const source = english
      .split(/\{\w+\}/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      // A placeholder stands for a number, a format or a code ("JSON", "PNG"), not for a font or icon name.
      .join("[^\\p{Ll}]+");
    return { keys, match: new RegExp(`^${source}$`, "u") };
  });
}

/** The language's own messages as whole-text patterns: text that matches one is a translation, not English left over. */
function translatedPatterns(language: (typeof LANGUAGES)[number]): RegExp[] {
  const catalog: Record<string, string | undefined> = catalogs[language];
  return Object.values(catalog).flatMap((text) => {
    if (!text || text.replace(/\{\w+\}/g, "").replace(/[^\p{L}]/gu, "").length < 2) return [];
    const source = text
      .split(/\{\w+\}/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("[^\\p{Ll}]+");
    return [new RegExp(`^${source}$`, "u")];
  });
}

for (const language of LANGUAGES) {
  test.describe(`no English left in ${language}`, () => {
    const patterns = englishLeftPatterns(language);
    const translated = translatedPatterns(language);
    const allowed = new Set(ALLOWED.filter((entry) => entry.languages.includes(language)).map((entry) => entry.text));

    for (const studio of studios) {
      test(`${studio.title}`, async ({ page }) => {
        const known = new Set(KNOWN[studio.href]?.texts ?? []);
        await page.addInitScript((value) => window.localStorage.setItem("designhub:locale", value), language);
        await page.goto(studio.href);
        await expect(page.locator("h1").first()).toBeVisible();
        const titleKey = `studio.${studio.id}.title` as keyof typeof en;
        await expect(page.locator("h1").first()).toHaveText(catalogs[language][titleKey] ?? en[titleKey]);
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

        const englishLeft = async () => {
          const texts = await page.evaluate(() => {
            const selector =
              "button, [role=button], [role=tab], [role=radio], [role=menuitem], [role=heading], label, legend, summary, h1, h2, h3, h4, h5, h6";
            const visible = (element: Element) =>
              (element as HTMLElement).checkVisibility({ visibilityProperty: true, opacityProperty: true });
            const clean = (text: string | null) => (text ?? "").replace(/\s+/g, " ").trim();
            const shown = [...document.querySelectorAll<HTMLElement>(selector)]
              .filter(visible)
              .map((element) => clean(element.innerText));
            // The names a screen reader and a pointer get: aria-label, title and placeholder of what is on screen.
            const named = [...document.querySelectorAll<HTMLElement>("[aria-label], [title], [placeholder]")]
              .filter(visible)
              .flatMap((element) =>
                ["aria-label", "title", "placeholder"].map((attribute) => clean(element.getAttribute(attribute))),
              );
            return [...new Set([...shown, ...named].filter(Boolean))];
          });
          return texts.flatMap((text) => {
            if (allowed.has(text) || known.has(text) || translated.some((pattern) => pattern.test(text))) return [];
            const found = patterns.find((pattern) => pattern.match.test(text));
            return found ? [`"${text}" (${found.keys.join(", ")})`] : [];
          });
        };
        // The language and each studio's messages load after the first paint, so wait for them to arrive.
        await hydrated(page);
        await expect
          .poll(englishLeft, { message: `${studio.title} in ${language} shows English text`, timeout: 10_000 })
          .toEqual([]);

        // Each tab of the studio, one at a time: most tools are behind tabs, which the first view does not show.
        const tabs = page.getByRole("tab");
        const count = await tabs.count();
        for (let index = 0; index < count; index += 1) {
          const tab = tabs.nth(index);
          if (!(await tab.isVisible()) || (await tab.getAttribute("aria-selected")) === "true") continue;
          await tab.click();
          await expect(tab).toHaveAttribute("aria-selected", "true");
          await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
          await expect
            .poll(englishLeft, {
              message: `${studio.title} in ${language} shows English text on tab ${index + 1}`,
              timeout: 10_000,
            })
            .toEqual([]);
        }
      });
    }
  });
}
