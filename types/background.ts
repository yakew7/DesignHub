export type BackgroundKind =
  | "waves"
  | "blobs"
  | "mesh"
  | "aurora"
  | "noise"
  | "dots"
  | "grid"
  | "isometric"
  | "rings"
  | "checks"
  | "low-poly"
  | "bokeh"
  | "confetti"
  | "chevron"
  | "hexagons"
  | "sunburst";

export type BackgroundSettings = {
  kind: BackgroundKind;
  seed: number;
  /** Foreground colors (hex), in order of prominence. */
  colors: string[];
  /** Canvas color (hex). */
  background: string;
  /** 0–100. What "density" means is up to each generator (layers, points, spacing…). */
  density: number;
  /** 0.25–4. Multiplies the size of the pattern features. */
  scale: number;
  /** Degrees, 0–360. */
  rotation: number;
  width: number;
  height: number;
};

export type BackgroundDefinition = {
  kind: BackgroundKind;
  label: string;
  description: string;
  /** Returns the drawing (without the outer <svg>) in a width × height coordinate space. */
  render: (settings: BackgroundSettings) => string;
  /** Native CSS when the pattern can be expressed without an image. */
  css?: (settings: BackgroundSettings) => string;
  /** Needs Paper.js (loaded lazily); renders with a built-in fallback until it's ready. */
  usesPaper?: boolean;
  /** Preferred starting values when the user switches to this generator. */
  defaults?: Partial<Omit<BackgroundSettings, "kind" | "seed" | "width" | "height">>;
};
