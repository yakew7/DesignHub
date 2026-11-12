import { expect, test } from "@playwright/test";

import { catalogs } from "../../lib/i18n/all-catalogs";
import { en } from "../../lib/i18n/messages/en";
import { studios } from "../../lib/navigation";

/**
 * A translated studio should have no English left on its first view. Every studio is opened in Spanish, French and
 * Hindi, and the visible text of its buttons, tabs, labels and headings must not equal the English text of a key that
 * has a different translation in that language. The failure names the studio, the text and the key.
 */
const LANGUAGES = ["es", "fr", "hi"] as const;

/** Text that is the same in a language on purpose. Each entry says why. */
const ALLOWED: readonly { text: string; languages: readonly string[]; reason: string }[] = [
  { text: "Material", languages: ["hi"], reason: "the Material Design icon set, a name" },
];

/**
 * English found when this test was added, by studio, with the issue that tracks it. Remove an entry once it is
 * translated. The studio titles are #563 on every studio that passes `studio.title` to its header.
 */
const KNOWN: Readonly<Record<string, { issue: number; texts: readonly string[] }>> = {
  "/effects": {
    issue: 564,
    texts: ["Effect", "Controls", "Preview", "Light", "Dark", "Gradient", "Shadow", "Border", "Radius"],
  },
  "/backgrounds": { issue: 565, texts: ["Controls", "Colors", "Palette", "Mesh", "Aurora"] },
  "/typography": { issue: 566, texts: ["Pairing", "Export", "Preview", "Compare", "All", "Favorites"] },
  "/export": {
    issue: 567,
    texts: [
      "Live preview",
      "Brand name",
      "Output",
      "CSS variables",
      "JSON tokens",
      "Copy",
      "Download JSON",
      "Background",
      "Optimized SVG",
    ],
  },
  "/brand": { issue: 568, texts: ["CSS variables", "JSON tokens"] },
  "/guidelines": { issue: 568, texts: ["Light", "Dark", "Gradient", "Minimal", "Editorial", "Export"] },
  "/svg": { issue: 568, texts: ["Solid"] },
};
const TITLES_IN_ENGLISH = new Set([
  "/accessibility",
  "/backgrounds",
  "/brand-dna",
  "/guidelines",
  "/effects",
  "/export",
  "/icons",
  "/logo",
  "/mockups",
  "/social",
  "/svg",
  "/typography",
]);

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

for (const language of LANGUAGES) {
  test.describe(`no English left in ${language}`, () => {
    const patterns = englishLeftPatterns(language);
    const allowed = new Set(ALLOWED.filter((entry) => entry.languages.includes(language)).map((entry) => entry.text));

    for (const studio of studios) {
      test(`${studio.title}`, async ({ page }) => {
        const known = new Set([
          ...(KNOWN[studio.href]?.texts ?? []),
          ...(TITLES_IN_ENGLISH.has(studio.href) ? [studio.title] : []),
        ]);
        await page.addInitScript((value) => window.localStorage.setItem("designhub:locale", value), language);
        await page.goto(studio.href);
        await expect(page.locator("h1").first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

        const englishLeft = async () => {
          const texts = await page.evaluate(() => {
            const selector =
              "button, [role=button], [role=tab], [role=radio], [role=menuitem], [role=heading], label, legend, summary, h1, h2, h3, h4, h5, h6";
            return [
              ...new Set(
                [...document.querySelectorAll<HTMLElement>(selector)]
                  .filter((element) => element.checkVisibility({ visibilityProperty: true, opacityProperty: true }))
                  .map((element) => element.innerText.replace(/\s+/g, " ").trim())
                  .filter(Boolean),
              ),
            ];
          });
          return texts.flatMap((text) => {
            if (allowed.has(text) || known.has(text)) return [];
            const found = patterns.find((pattern) => pattern.match.test(text));
            return found ? [`"${text}" (${found.keys.join(", ")})`] : [];
          });
        };
        // The language and each studio's messages load after the first paint, so wait for them to arrive.
        await expect
          .poll(englishLeft, { message: `${studio.title} in ${language} shows English text`, timeout: 10_000 })
          .toEqual([]);
      });
    }
  });
}
