export type PaletteTag =
  | "SaaS"
  | "Pastel"
  | "Earthy"
  | "Neon"
  | "Monochrome"
  | "Retro"
  | "Ocean"
  | "Sunset"
  | "Forest"
  | "Luxury"
  | "Corporate"
  | "Playful";

export type PalettePreset = { name: string; tags: PaletteTag[]; colors: string[] };

export const paletteTags: PaletteTag[] = [
  "SaaS",
  "Corporate",
  "Pastel",
  "Playful",
  "Neon",
  "Retro",
  "Earthy",
  "Forest",
  "Ocean",
  "Sunset",
  "Luxury",
  "Monochrome",
];

/** Hand-picked starting points. Loading one replaces the palette and can be undone. */
export const palettePresets: PalettePreset[] = [
  { name: "Indigo launch", tags: ["SaaS"], colors: ["#0f172a", "#6366f1", "#f472b6", "#fbbf24", "#f8fafc"] },
  {
    name: "Linear night",
    tags: ["SaaS", "Monochrome"],
    colors: ["#08090a", "#1c1d22", "#5e6ad2", "#8a8f98", "#f7f8f8"],
  },
  {
    name: "Stripe gradient",
    tags: ["SaaS", "Playful"],
    colors: ["#0a2540", "#635bff", "#00d4ff", "#ff80b5", "#f6f9fc"],
  },
  { name: "Emerald growth", tags: ["SaaS", "Forest"], colors: ["#022c22", "#059669", "#34d399", "#fde68a", "#f0fdf4"] },
  {
    name: "Cobalt console",
    tags: ["SaaS", "Corporate"],
    colors: ["#0b1120", "#1d4ed8", "#38bdf8", "#e2e8f0", "#ffffff"],
  },
  { name: "Violet studio", tags: ["SaaS", "Luxury"], colors: ["#12002b", "#7c3aed", "#c084fc", "#f5d0fe", "#faf5ff"] },
  { name: "Boardroom", tags: ["Corporate"], colors: ["#111827", "#1e3a8a", "#2563eb", "#9ca3af", "#f9fafb"] },
  { name: "Trust teal", tags: ["Corporate", "Ocean"], colors: ["#042f2e", "#0f766e", "#14b8a6", "#cbd5e1", "#f8fafc"] },
  {
    name: "Fintech slate",
    tags: ["Corporate", "Monochrome"],
    colors: ["#020617", "#334155", "#0ea5e9", "#94a3b8", "#f1f5f9"],
  },
  {
    name: "Healthcare calm",
    tags: ["Corporate", "Pastel"],
    colors: ["#0c4a6e", "#0284c7", "#7dd3fc", "#dcfce7", "#ffffff"],
  },
  {
    name: "Cotton candy",
    tags: ["Pastel", "Playful"],
    colors: ["#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff", "#cdb4db"],
  },
  { name: "Soft mint", tags: ["Pastel", "Forest"], colors: ["#d8f3dc", "#b7e4c7", "#95d5b2", "#74c69d", "#2d6a4f"] },
  { name: "Lavender haze", tags: ["Pastel"], colors: ["#e0c3fc", "#c3aed6", "#b8c0ff", "#bbd0ff", "#f5f3ff"] },
  { name: "Peach sorbet", tags: ["Pastel", "Sunset"], colors: ["#ffe5d9", "#ffcad4", "#f4acb7", "#9d8189", "#fff8f3"] },
  { name: "Morning sky", tags: ["Pastel", "Ocean"], colors: ["#caf0f8", "#ade8f4", "#90e0ef", "#48cae4", "#0077b6"] },
  { name: "Arcade", tags: ["Playful", "Neon"], colors: ["#1a1a2e", "#e94560", "#0f3460", "#16c79a", "#f9ed69"] },
  { name: "Primary school", tags: ["Playful"], colors: ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#fefce8"] },
  {
    name: "Bubblegum pop",
    tags: ["Playful", "Pastel"],
    colors: ["#ff5d8f", "#ff97b7", "#ffcad4", "#8ecae6", "#219ebc"],
  },
  {
    name: "Citrus splash",
    tags: ["Playful", "Sunset"],
    colors: ["#fb5607", "#ffbe0b", "#8338ec", "#3a86ff", "#fff3e0"],
  },
  { name: "Cyberpunk", tags: ["Neon"], colors: ["#0d0221", "#ff2a6d", "#05d9e8", "#d1f7ff", "#f9f871"] },
  { name: "Synthwave", tags: ["Neon", "Retro"], colors: ["#241734", "#2e2157", "#fd3777", "#f706cf", "#fdb232"] },
  { name: "Acid lime", tags: ["Neon"], colors: ["#0a0a0a", "#ccff00", "#00ff9c", "#00b3ff", "#f5f5f5"] },
  {
    name: "Tokyo night",
    tags: ["Neon", "Monochrome"],
    colors: ["#1a1b26", "#7aa2f7", "#bb9af7", "#9ece6a", "#c0caf5"],
  },
  { name: "Seventies", tags: ["Retro", "Earthy"], colors: ["#e76f51", "#f4a261", "#e9c46a", "#2a9d8f", "#264653"] },
  { name: "Diner", tags: ["Retro", "Playful"], colors: ["#d62828", "#f77f00", "#fcbf49", "#eae2b7", "#003049"] },
  { name: "Polaroid", tags: ["Retro", "Pastel"], colors: ["#f2e8cf", "#a7c957", "#6a994e", "#bc4749", "#386641"] },
  { name: "Vintage print", tags: ["Retro"], colors: ["#1d3557", "#457b9d", "#a8dadc", "#f1faee", "#e63946"] },
  { name: "Terracotta", tags: ["Earthy", "Sunset"], colors: ["#582f0e", "#7f4f24", "#b08968", "#ddb892", "#ede0d4"] },
  { name: "Desert sand", tags: ["Earthy"], colors: ["#3d2c2e", "#a0522d", "#d2b48c", "#f5deb3", "#fffaf0"] },
  {
    name: "Clay and sage",
    tags: ["Earthy", "Forest"],
    colors: ["#3f4238", "#6b705c", "#a5a58d", "#cb997e", "#ffe8d6"],
  },
  { name: "Coffee shop", tags: ["Earthy", "Luxury"], colors: ["#1b120f", "#4a2c2a", "#8b5e3c", "#d4a373", "#faedcd"] },
  { name: "Pine forest", tags: ["Forest"], colors: ["#081c15", "#1b4332", "#2d6a4f", "#52b788", "#d8f3dc"] },
  { name: "Moss", tags: ["Forest", "Earthy"], colors: ["#283618", "#606c38", "#dda15e", "#bc6c25", "#fefae0"] },
  { name: "Botanical", tags: ["Forest", "Pastel"], colors: ["#344e41", "#3a5a40", "#588157", "#a3b18a", "#dad7cd"] },
  { name: "Deep sea", tags: ["Ocean"], colors: ["#03045e", "#023e8a", "#0077b6", "#00b4d8", "#caf0f8"] },
  { name: "Lagoon", tags: ["Ocean", "Playful"], colors: ["#006d77", "#83c5be", "#edf6f9", "#ffddd2", "#e29578"] },
  {
    name: "Nordic fjord",
    tags: ["Ocean", "Monochrome"],
    colors: ["#2e3440", "#3b4252", "#5e81ac", "#88c0d0", "#eceff4"],
  },
  { name: "Coral reef", tags: ["Ocean", "Sunset"], colors: ["#264653", "#2a9d8f", "#f4a261", "#ff6b6b", "#fff1e6"] },
  { name: "Golden hour", tags: ["Sunset"], colors: ["#3d0c11", "#9d0208", "#dc2f02", "#f48c06", "#ffba08"] },
  { name: "Dusk", tags: ["Sunset", "Luxury"], colors: ["#10002b", "#3c096c", "#9d4edd", "#ff9e00", "#ffd6a5"] },
  { name: "Miami", tags: ["Sunset", "Neon"], colors: ["#ff006e", "#fb5607", "#ffbe0b", "#3a86ff", "#8338ec"] },
  {
    name: "Black and gold",
    tags: ["Luxury", "Monochrome"],
    colors: ["#0b0b0b", "#1f1f1f", "#bfa06a", "#e6d5a8", "#faf7f0"],
  },
  {
    name: "Emerald velvet",
    tags: ["Luxury", "Forest"],
    colors: ["#04160f", "#0b3d2e", "#1f7a5a", "#c9a227", "#f5efe0"],
  },
  { name: "Burgundy", tags: ["Luxury"], colors: ["#1a0005", "#590d22", "#a4133c", "#ff8fa3", "#fff0f3"] },
  { name: "Champagne", tags: ["Luxury", "Pastel"], colors: ["#3c2f2f", "#8d7b68", "#c8b6a6", "#f1dec9", "#fffbf5"] },
  { name: "Graphite", tags: ["Monochrome"], colors: ["#0a0a0a", "#262626", "#525252", "#a3a3a3", "#fafafa"] },
  {
    name: "Paper and ink",
    tags: ["Monochrome", "Retro"],
    colors: ["#1b1b1e", "#373f51", "#a9bcd0", "#d8dbe2", "#fbfbf8"],
  },
  {
    name: "Blueprint",
    tags: ["Monochrome", "Corporate"],
    colors: ["#0b1d3a", "#123a70", "#2b6cb0", "#90cdf4", "#ebf8ff"],
  },
];
