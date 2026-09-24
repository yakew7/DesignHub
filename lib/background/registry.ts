import { bokeh } from "@/lib/background/generators/bokeh";
import { checks } from "@/lib/background/generators/checks";
import { chevron } from "@/lib/background/generators/chevron";
import { confetti } from "@/lib/background/generators/confetti";
import { hexagons } from "@/lib/background/generators/hexagons";
import { lowPoly } from "@/lib/background/generators/low-poly";
import { rings } from "@/lib/background/generators/rings";
import { sunburst } from "@/lib/background/generators/sunburst";
import { aurora } from "@/lib/background/generators/aurora";
import { blobs } from "@/lib/background/generators/blobs";
import { dots } from "@/lib/background/generators/dots";
import { grid } from "@/lib/background/generators/grid";
import { isometric } from "@/lib/background/generators/isometric";
import { mesh } from "@/lib/background/generators/mesh";
import { noise } from "@/lib/background/generators/noise";
import { topographic } from "@/lib/background/generators/topographic";
import { waves } from "@/lib/background/generators/waves";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundKind, BackgroundSettings } from "@/types/background";

/** Generators register themselves here as they are implemented. */
export const backgroundGenerators: BackgroundDefinition[] = [
  waves,
  blobs,
  mesh,
  aurora,
  noise,
  dots,
  grid,
  isometric,
  rings,
  checks,
  lowPoly,
  bokeh,
  confetti,
  chevron,
  hexagons,
  sunburst,
  topographic,
];

export function getGenerator(kind: BackgroundKind): BackgroundDefinition | undefined {
  return backgroundGenerators.find((generator) => generator.kind === kind);
}

/** Complete SVG document for the current settings. */
export function renderBackgroundSvg(settings: BackgroundSettings): string {
  const generator = getGenerator(settings.kind);
  return generator ? generator.render(settings) : wrapSvg(settings, "");
}
