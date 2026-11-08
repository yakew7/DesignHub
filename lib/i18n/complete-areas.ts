/**
 * Key prefixes that are translated completely in every language. A missing translation falls back
 * to English, which is fine while an area is being translated, so an area only joins this list
 * once es, fr and hi all have every one of its keys. After that the tests fail when a key goes
 * missing, and name it. See docs/translating.md.
 */
export const completeAreas = [
  "a11y.",
  "brand.",
  "code.",
  "colors.",
  "command.",
  "common.",
  "compare.",
  "copy.",
  "effects.",
  "error.",
  "history.",
  "home.",
  "icons.",
  "language.",
  "logo.",
  "mockups.",
  "mode.",
  "launch.",
  "nav.",
  "projects.",
  "search.",
  "share.",
  "shortcuts.",
  "social.",
  "studio.",
  "svg.",
  "theme.",
  "typography.",
] as const;
