import type { BrandTokens } from "@/types/brand";

export type CompareGroup = "Colors" | "Fonts" | "Radius" | "Spacing" | "Shadow";

/** One side of a row: readable text, plus the hex values when the row is a set of colors. */
export type CompareValue = { text: string; colors?: string[] };

export type CompareRow = {
  id: string;
  group: CompareGroup;
  label: string;
  a: CompareValue;
  b: CompareValue;
  changed: boolean;
};

function colorValue(hexes: string[]): CompareValue {
  const colors = hexes.map((hex) => hex.toUpperCase());
  return { text: colors.length ? colors.join(", ") : "None", colors };
}

function sameColors(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((hex, index) => hex.toUpperCase() === b[index]?.toUpperCase());
}

function font(family: string, weight: number): string {
  return `${family} ${weight}`;
}

/**
 * Lines two brands up value by value: colors by role, fonts with their weight, radius,
 * spacing and shadow. Pure, so it can compare stored projects without touching the live stores.
 */
export function compareBrands(a: BrandTokens, b: BrandTokens): CompareRow[] {
  const colorRows = (["primary", "secondary", "neutrals"] as const).map((key): CompareRow => {
    const label = key === "neutrals" ? "Neutral" : key === "primary" ? "Primary" : "Secondary";
    return {
      id: `colors-${key}`,
      group: "Colors",
      label,
      a: colorValue(a.colors[key]),
      b: colorValue(b.colors[key]),
      changed: !sameColors(a.colors[key], b.colors[key]),
    };
  });
  const text = (id: string, group: CompareGroup, label: string, left: string, right: string): CompareRow => ({
    id,
    group,
    label,
    a: { text: left },
    b: { text: right },
    changed: left !== right,
  });
  return [
    ...colorRows,
    text(
      "font-heading",
      "Fonts",
      "Heading",
      font(a.typography.heading, a.typography.headingWeight),
      font(b.typography.heading, b.typography.headingWeight),
    ),
    text(
      "font-body",
      "Fonts",
      "Body",
      font(a.typography.body, a.typography.bodyWeight),
      font(b.typography.body, b.typography.bodyWeight),
    ),
    text("radius", "Radius", "Base radius", `${a.radius}px`, `${b.radius}px`),
    text("spacing", "Spacing", "Base spacing", `${a.spacing}px`, `${b.spacing}px`),
    text("shadow", "Shadow", "Shadow", a.shadow, b.shadow),
  ];
}

/** "No differences", "1 difference" or "3 differences". */
export function differenceSummary(rows: CompareRow[]): string {
  const count = rows.filter((row) => row.changed).length;
  if (count === 0) return "No differences";
  return `${count} ${count === 1 ? "difference" : "differences"}`;
}
