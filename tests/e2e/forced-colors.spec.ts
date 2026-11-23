import { expect, test, type Locator, type Page } from "@playwright/test";

import { scanWithTabs } from "./axe-scan";
import { hydrated } from "./storage";

/**
 * Forced colors (Windows high contrast) replaces every color with a system color and removes box shadows, and
 * "more contrast" asks for stronger borders and focus. What disappears is whatever was drawn only by a shadow ring,
 * a background fill or a faint border color. This spec emulates both modes on three studios, in light and dark,
 * and measures from computed styles (not pixels, so the result does not depend on the platform) that a focus ring,
 * a switch, a folded section header, a bordered panel and the selected option of a segmented control are still
 * visible. The styles that make them so are the `forced-colors` and `prefers-contrast` blocks of app/globals.css.
 */

type Rgb = [number, number, number];

interface Measure {
  /** The element matches :focus-visible (it must, or its outline says nothing about a keyboard user). */
  focusVisible: boolean;
  /** The color behind the element, the page and every surface it sits on, composited. */
  behind: Rgb;
  /** The color of the element's own box: its background over `behind`. */
  fill: Rgb;
  outline: { style: string; width: number; color: Rgb };
  border: { style: string; width: number; color: Rgb };
  /** The stroke of an svg (an icon), or null when the element has none. */
  stroke: Rgb | null;
  /** `transform` and `rotate` together: Tailwind turns an icon with the `rotate` property. */
  turn: string;
}

/** Reads what an element looks like from its computed style. Runs in the page, so it needs no outside helper. */
function measure(element: Element): Measure {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("A canvas is needed to resolve colors");
  // Paints the layers in order over white and returns the result, so any CSS color (oklch, alpha) is resolved.
  const paint = (layers: string[]): Rgb => {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 1, 1);
    for (const layer of layers) {
      context.fillStyle = layer;
      context.fillRect(0, 0, 1, 1);
    }
    const data = context.getImageData(0, 0, 1, 1).data;
    return [data[0], data[1], data[2]];
  };

  const parents: string[] = [];
  for (let node = element.parentElement; node; node = node.parentElement) {
    parents.unshift(getComputedStyle(node).backgroundColor);
  }
  const style = getComputedStyle(element);
  const own = [...parents, style.backgroundColor];
  return {
    focusVisible: element.matches(":focus-visible"),
    behind: paint(parents),
    fill: paint(own),
    outline: {
      style: style.outlineStyle,
      width: parseFloat(style.outlineWidth),
      color: paint([...parents, style.outlineColor]),
    },
    border: {
      style: style.borderTopStyle,
      width: parseFloat(style.borderTopWidth),
      color: paint([...own, style.borderTopColor]),
    },
    stroke: style.stroke === "none" ? null : paint([...own, style.stroke]),
    turn: `${style.transform} ${style.rotate}`,
  };
}

function luminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** The WCAG contrast ratio of two colors, 1 (identical) to 21. 3 is the minimum for a control's boundary (1.4.11). */
function ratio(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const MINIMUM = 3;

const read = (locator: Locator) => locator.evaluate(measure);

/** Waits for the transitions to end, so a color is measured where it stays and not on its way. */
async function settled(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
}

/** What is wrong with the focus ring of an element, as sentences; empty when it is visible. */
function ringProblems(what: string, m: Measure): string[] {
  const problems: string[] = [];
  if (!m.focusVisible) problems.push(`${what} did not match :focus-visible`);
  if (m.outline.style === "none" || m.outline.style === "hidden") problems.push(`${what} has no focus outline`);
  if (!(m.outline.width >= 2)) problems.push(`${what} has a focus outline ${m.outline.width}px wide`);
  const contrast = ratio(m.outline.color, m.behind);
  if (contrast < MINIMUM) problems.push(`${what} has a focus outline with contrast ${contrast.toFixed(2)}:1`);
  return problems;
}

const STUDIOS = [
  // What each studio has on first view, so a control that goes missing fails a test instead of skipping it.
  // `sections` is a folded panel to open and the button that loads its sections (a Section is a fold inside a panel).
  { name: "Typography", path: "/typography", switch: true, segmented: true, sections: undefined },
  { name: "Projects", path: "/projects", switch: true, segmented: false, sections: ["Storage", "Check storage"] },
  { name: "Brand", path: "/brand", switch: false, segmented: true, sections: undefined },
];

const MODES = [
  {
    name: "forced colors",
    media: { forcedColors: "active" } as const,
    // axe-core reads the colors a page asks for, but in forced colors the browser paints its own palette instead (it
    // reports a white-on-white button that is black on white on screen), so its contrast rule says nothing true there.
    // The visibility of what matters is measured by the tests above instead, from the colors actually in use.
    skipRules: ["color-contrast"],
  },
  { name: "more contrast", media: { contrast: "more" } as const, skipRules: [] as string[] },
];

const THEMES = ["light", "dark"] as const;

async function open(
  page: Page,
  mode: (typeof MODES)[number],
  theme: (typeof THEMES)[number],
  studio: (typeof STUDIOS)[number],
) {
  await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);
  await page.emulateMedia({ ...mode.media, colorScheme: theme, reducedMotion: "reduce" });
  await page.goto(studio.path);
  await hydrated(page);
  await expect(page.locator("h1").first()).toBeVisible();
  // Guard the emulation itself, so a mode that did not apply cannot pass by showing the normal page.
  const applied = await page.evaluate(
    (query) => window.matchMedia(query).matches,
    "forcedColors" in mode.media ? "(forced-colors: active)" : "(prefers-contrast: more)",
  );
  expect(applied, `${mode.name} is emulated`).toBe(true);
  if (studio.sections) {
    const [panel, load] = studio.sections;
    const toggle = page.getByRole("button", { name: panel, exact: true });
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("button", { name: load, exact: true }).click();
    await expect(page.locator("h3 > button[data-section-toggle]").first()).toBeVisible();
  }
}

for (const mode of MODES) {
  for (const theme of THEMES) {
    for (const studio of STUDIOS) {
      test.describe(`${studio.name}, ${mode.name}, ${theme} theme`, () => {
        test.beforeEach(async ({ page }) => {
          await open(page, mode, theme, studio);
        });

        test("the focus ring of a link, a section header, a switch and a segmented option is visible", async ({
          page,
        }) => {
          const targets: [string, Locator][] = [
            ["the first link", page.getByRole("link").first()],
            ["a section header", page.locator("h2 > button[aria-expanded], h3 > button[aria-expanded]").first()],
          ];
          if (studio.segmented) {
            targets.push(["a segmented option", page.locator('[data-slot="toggle-group-item"]').first()]);
          }
          if (studio.switch) targets.push(["a switch", page.getByRole("switch").first()]);

          const problems: string[] = [];
          for (const [what, locator] of targets) {
            await expect(locator, `${what} is on the page`).toBeVisible();
            await page.keyboard.press("Shift"); // keyboard use, so the focus below counts as :focus-visible
            await locator.focus();
            await expect(locator).toBeFocused();
            await settled(page);
            problems.push(...ringProblems(what, await read(locator)));
          }
          expect(problems).toEqual([]);
        });

        test("a switch shows its border, its thumb and whether it is on", async ({ page }) => {
          test.skip(!studio.switch, "this studio has no switch on first view");
          const track = page.getByRole("switch").first();
          const thumb = track.locator('[data-slot="switch-thumb"]');
          await expect(track).toBeVisible();

          const states: { track: Measure; thumb: Measure }[] = [];
          for (let turn = 0; turn < 2; turn += 1) {
            const before = await track.getAttribute("aria-checked");
            if (turn > 0) {
              await track.click();
              await expect(track).not.toHaveAttribute("aria-checked", before ?? "");
            }
            await settled(page);
            states.push({ track: await read(track), thumb: await read(thumb) });
          }

          const problems: string[] = [];
          for (const [index, state] of states.entries()) {
            const label = `state ${index + 1}`;
            const border = state.track.border;
            if (border.style === "none" || !(border.width >= 1)) problems.push(`${label}: the track has no border`);
            else if (ratio(border.color, state.track.behind) < MINIMUM)
              problems.push(`${label}: the track border is ${ratio(border.color, state.track.behind).toFixed(2)}:1`);
            const thumbOnTrack = ratio(state.thumb.fill, state.track.fill);
            if (thumbOnTrack < MINIMUM)
              problems.push(`${label}: the thumb on the track is ${thumbOnTrack.toFixed(2)}:1`);
          }
          const between = ratio(states[0].track.fill, states[1].track.fill);
          if (between < MINIMUM) problems.push(`on and off tracks differ by only ${between.toFixed(2)}:1`);
          expect(problems).toEqual([]);
        });

        test("a section header keeps its chevron, its state and its focus ring", async ({ page }) => {
          // The section header goes first: folding the panel that holds it unloads its body.
          const headers: [string, Locator][] = [];
          if (studio.sections)
            headers.push(["section header", page.locator("h3 > button[data-section-toggle]").first()]);
          headers.push(["panel header", page.locator("h2 > button[aria-expanded]").first()]);

          const problems: string[] = [];
          for (const [what, header] of headers) {
            await expect(header, `${what} is on the page`).toBeVisible();
            const chevron = header.locator("svg").first();
            const box = await chevron.boundingBox();
            if (!box || box.width < 8) problems.push(`${what}: the chevron has no size`);
            const icon = await read(chevron);
            if (!icon.stroke) problems.push(`${what}: the chevron has no stroke`);
            else if (ratio(icon.stroke, icon.fill) < MINIMUM)
              problems.push(`${what}: the chevron is ${ratio(icon.stroke, icon.fill).toFixed(2)}:1`);

            // Open and closed differ by more than color: the chevron turns.
            const open = (await header.getAttribute("aria-expanded")) === "true";
            const before = icon.turn;
            await page.keyboard.press("Shift");
            await header.focus();
            await page.keyboard.press("Enter");
            await expect(header).toHaveAttribute("aria-expanded", String(!open));
            await settled(page);
            if ((await read(chevron)).turn === before) problems.push(`${what}: the chevron does not turn`);
            await page.keyboard.press("Enter");
            await expect(header).toHaveAttribute("aria-expanded", String(open));

            await page.keyboard.press("Shift");
            await header.focus();
            await settled(page);
            problems.push(...ringProblems(what, await read(header)));
          }
          expect(problems).toEqual([]);
        });

        test("a bordered panel keeps a visible border", async ({ page }) => {
          const panel = page.locator("section.border, [data-slot='card']").first();
          await expect(panel).toBeVisible();
          const m = await read(panel);
          expect(m.border.style, "border style").not.toBe("none");
          expect(m.border.width, "border width").toBeGreaterThanOrEqual(1);
          expect(ratio(m.border.color, m.behind), "border against the page").toBeGreaterThanOrEqual(MINIMUM);
        });

        test("the selected option and the selected tab differ from the others by more than a faint fill", async ({
          page,
        }) => {
          test.skip(!studio.segmented, "this studio has no segmented control on first view");
          const group = page.locator('[data-slot="toggle-group"]').filter({ has: page.locator('[data-state="on"]') });
          const pairs: [string, Locator, Locator][] = [
            [
              "segmented control",
              group.first().locator('[data-state="on"]').first(),
              group.first().locator('[data-state="off"]').first(),
            ],
          ];
          const tabs = page.locator('[data-slot="tabs-trigger"]');
          if ((await tabs.count()) > 1) {
            pairs.push([
              "tabs",
              page.locator('[data-slot="tabs-trigger"][data-state="active"]').first(),
              page.locator('[data-slot="tabs-trigger"][data-state="inactive"]').first(),
            ]);
          }

          const problems: string[] = [];
          for (const [what, selected, other] of pairs) {
            await expect(selected, `${what}: a selected item`).toBeVisible();
            await expect(other, `${what}: an unselected item`).toBeVisible();
            const [a, b] = [await read(selected), await read(other)];
            const difference = ratio(a.fill, b.fill);
            if (difference < MINIMUM)
              problems.push(`${what}: selected and unselected differ by ${difference.toFixed(2)}:1`);
          }
          expect(problems).toEqual([]);
        });

        test("axe finds no serious or critical violation, on first view and in each tab", async ({ page }) => {
          const problems = await scanWithTabs(page, `${studio.name} (${mode.name}, ${theme})`, mode.skipRules);
          expect(problems, `Violations in ${studio.name}`).toEqual([]);
        });
      });
    }
  }
}
