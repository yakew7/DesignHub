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

  test("finds label and description props on form fields and skips code values", () => {
    const source = `export function C({ t }) {
  return (
    <div>
      <SliderField label="Scale" description="Adjusts grain size." variant="ease-out" name="grain-scale" />
      <Choice label={"Color Studio"} description={\`Across \${4} stops.\`} value="color-studio" />
      <Choice label="effects.field.gradient" description="font-mono" size="sm" />
      <SliderField label={t("effects.field.blur")} description={t("effects.field.blurHint")} />
    </div>
  );
}`;
    expect(hardcodedIn("c.tsx", source)).toEqual([
      { line: 4, text: "Scale", kind: "label" },
      { line: 4, text: "Adjusts grain size.", kind: "description" },
      { line: 5, text: "Color Studio", kind: "label" },
      { line: 5, text: "Across {} stops.", kind: "description" },
    ]);
  });

  test("finds labels and descriptions in data arrays while ignoring message keys and code tokens", () => {
    const source = `type Option = { value: string; label: "Primary option" };
const easings = [
  { value: "ease-out", label: "Ease out" },
  { value: "box", label: "Box" },
  { value: "text", label: "Text" },
  { value: "gradient", label: "effects.field.gradient" },
  { value: "primary", label: "btn-primary" },
  { value: "custom", label: t("effects.custom") },
];
const toastOpts = { description: "Try again, or copy the code.", classNames: { description: "!text-muted-foreground" } };`;
    expect(hardcodedIn("d.tsx", source)).toEqual([
      { line: 3, text: "Ease out", kind: "label" },
      { line: 4, text: "Box", kind: "label" },
      { line: 5, text: "Text", kind: "label" },
      { line: 10, text: "Try again, or copy the code.", kind: "description" },
    ]);
  });

  test("finds template literal aria-labels and JSX children while skipping dynamic-only templates", () => {
    const source = `export function E({ index, label, value, id, name, percent, t }) {
  return (
    <div>
      <button aria-label={\`Remove layer \${index + 1}\`} title={\`\${label}: \${value}\`} data-id={\`item-\${id}\`}>
        <span>{\`\${name}, \${percent}% of this color\`}</span>
        <span>{\`\${t("a.b")} (\${percent}%)\`}</span>
      </button>
    </div>
  );
}`;
    expect(hardcodedIn("e.tsx", source)).toEqual([
      { line: 4, text: "Remove layer {}", kind: "aria-label" },
      { line: 5, text: "{}, {}% of this color", kind: "text" },
    ]);
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
