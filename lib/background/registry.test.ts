import { describe, expect, test } from "vitest";

import { backgroundGenerators } from "@/lib/background/registry";
import { rootSize, xmlError } from "@/lib/test/xml";
import { defaultBackground } from "@/store/background-store";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

function settingsFor(generator: BackgroundDefinition, seed: number): BackgroundSettings {
  return { ...defaultBackground, ...generator.defaults, kind: generator.kind, seed };
}

// Loops over the registry, so a new generator is covered as soon as it is registered.
describe.each(backgroundGenerators.map((generator) => [generator.kind, generator] as const))(
  "%s",
  (_kind, generator) => {
    test("renders the same SVG for the same seed", () => {
      expect(generator.render(settingsFor(generator, 42))).toBe(generator.render(settingsFor(generator, 42)));
    });

    test("renders a different SVG for a different seed", () => {
      expect(generator.render(settingsFor(generator, 42))).not.toBe(generator.render(settingsFor(generator, 7)));
    });

    test("renders well-formed XML at the requested size", () => {
      const settings = settingsFor(generator, 42);
      const svg = generator.render(settings);
      expect(xmlError(svg)).toBeNull();
      const size = rootSize(svg);
      expect(size.tag).toBe("svg");
      expect(size.width).toBe(settings.width);
      expect(size.height).toBe(settings.height);
    });

    test("stays well formed when rotated", () => {
      expect(xmlError(generator.render({ ...settingsFor(generator, 42), rotation: 30 }))).toBeNull();
    });
  },
);
