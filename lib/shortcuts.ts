import { studios } from "@/lib/navigation";

export type ShortcutDefinition = {
  keys: string[];
  description: string;
  scope: "Global" | "Colors" | "Typography" | "Icons" | "Backgrounds" | "Mockups" | "Social";
};

export const shortcuts: ShortcutDefinition[] = [
  { keys: ["⌘", "K"], description: "Open command palette", scope: "Global" },
  { keys: ["/"], description: "Open command palette", scope: "Global" },
  { keys: ["?"], description: "Show keyboard shortcuts", scope: "Global" },
  { keys: ["⌥", "T"], description: "Toggle dark / light theme", scope: "Global" },
  { keys: ["G", "H"], description: "Go home", scope: "Global" },
  // "g then letter" navigation, read from the studio list so every studio is listed.
  ...studios.map((studio): ShortcutDefinition => ({
    keys: ["G", studio.shortcut.toUpperCase()],
    description: `Go to ${studio.title}`,
    scope: "Global",
  })),
  { keys: ["Space"], description: "Generate palette", scope: "Colors" },
  { keys: ["Z"], description: "Undo palette change", scope: "Colors" },
  { keys: ["⇧", "Z"], description: "Redo palette change", scope: "Colors" },
  { keys: ["F"], description: "Focus font search", scope: "Typography" },
  { keys: ["F"], description: "Focus icon search", scope: "Icons" },
  { keys: ["R"], description: "Rotate icon 90° clockwise", scope: "Icons" },
  { keys: ["⇧", "R"], description: "Rotate icon 90° counter-clockwise", scope: "Icons" },
  { keys: ["Space"], description: "Random font pair (Pairing tab)", scope: "Typography" },
  { keys: ["↑", "↓"], description: "Move through the font list", scope: "Typography" },
  { keys: ["Home", "End"], description: "First or last font", scope: "Typography" },
  { keys: ["Enter"], description: "Open the highlighted font", scope: "Typography" },
  { keys: ["S"], description: "Favorite the highlighted font", scope: "Typography" },
  { keys: ["Space"], description: "New random seed", scope: "Backgrounds" },
  { keys: ["]"], description: "Next template", scope: "Mockups" },
  { keys: ["["], description: "Previous template", scope: "Mockups" },
  { keys: ["]"], description: "Next template", scope: "Social" },
  { keys: ["["], description: "Previous template", scope: "Social" },
];
