export type EffectKind = "glass" | "neumorphism" | "shadow" | "inset" | "glow" | "border" | "grain" | "long-shadow";

export type GlassSettings = {
  blur: number;
  saturation: number;
  tint: string;
  opacity: number;
  borderOpacity: number;
  shadowOpacity: number;
  radius: number;
};

export type NeumorphismShape = "flat" | "concave" | "convex" | "pressed";

export type NeumorphismSettings = {
  color: string;
  depth: number;
  blur: number;
  intensity: number;
  lightAngle: number;
  radius: number;
  shape: NeumorphismShape;
};

export type ShadowLayer = {
  id: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
};

export type ShadowSettings = { layers: ShadowLayer[]; radius: number };

/** One inset shadow, for inputs, wells and pressed states. */
export type InsetSettings = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  /** Background of the recessed element. */
  fill: string;
  radius: number;
};

export type GlowSettings = {
  color: string;
  radius: number;
  intensity: number;
  text: boolean;
  radiusCorner: number;
};

export type BorderSettings = {
  colors: string[];
  /** Inner fill painted over the gradient (padding-box). */
  fill: string;
  thickness: number;
  radius: number;
  angle: number;
  animated: boolean;
  speed: number;
};

export type BlendMode = "overlay" | "soft-light" | "multiply" | "screen" | "normal";

export type GrainSettings = {
  scale: number;
  opacity: number;
  frequency: number;
  blend: BlendMode;
};

export type LongShadowTarget = "box" | "text";

/** A flat-design shadow that runs out at an angle, built from stacked hard-edged steps. */
export type LongShadowSettings = {
  /** Direction the shadow runs, in degrees clockwise from the right (45 is down and to the right). */
  angle: number;
  /** In px. */
  length: number;
  color: string;
  /** 0 keeps the shadow solid, 1 fades it out completely by its far end. */
  fade: number;
  target: LongShadowTarget;
  /** Background of the box (box target only). */
  fill: string;
  radius: number;
};

export type EffectSettingsMap = {
  glass: GlassSettings;
  neumorphism: NeumorphismSettings;
  shadow: ShadowSettings;
  inset: InsetSettings;
  glow: GlowSettings;
  border: BorderSettings;
  grain: GrainSettings;
  "long-shadow": LongShadowSettings;
};

/** A CSS property/value pair. Vendor-prefixed duplicates are allowed. */
export type CssDeclaration = { property: string; value: string };

/** Everything an effect produces. `extra` holds pseudo-elements, keyframes or @property rules. */
export type EffectCss = {
  declarations: CssDeclaration[];
  extra?: (selector: string) => string;
  /** Top-level at-rules (@property, @keyframes) that can't be nested inside a selector or utility. */
  global?: string;
  /** Some effects (animated borders, grain overlays) can't be expressed as Tailwind utilities alone. */
  tailwindNote?: string;
  /** The page color this effect is designed to sit on (e.g. neumorphism needs a matching surface). */
  surface?: string;
  /** Preview-only: give the sample card a solid fill (shadows and glows need something to cast from). */
  needsFill?: boolean;
};

export type EffectBackdrop = "gradient" | "photo" | "light" | "dark";
