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
  { keys: ["G", "R"], description: "Go to Brand Studio", scope: "Global" },
  { keys: ["G", "L"], description: "Go to Logo Studio", scope: "Global" },
  { keys: ["G", "M"], description: "Go to Mockup Studio", scope: "Global" },
  { keys: ["G", "T"], description: "Go to Typography Studio", scope: "Global" },
  { keys: ["G", "C"], description: "Go to Color Studio", scope: "Global" },
  { keys: ["G", "I"], description: "Go to Icon Studio", scope: "Global" },
  { keys: ["G", "B"], description: "Go to Background Studio", scope: "Global" },
  { keys: ["G", "F"], description: "Go to Effects Lab", scope: "Global" },
  { keys: ["G", "S"], description: "Go to SVG Playground", scope: "Global" },
  { keys: ["G", "A"], description: "Go to Accessibility Lab", scope: "Global" },
  { keys: ["G", "E"], description: "Go to Export Engine", scope: "Global" },
  { keys: ["Space"], description: "Generate palette", scope: "Colors" },
  { keys: ["Z"], description: "Undo palette change", scope: "Colors" },
  { keys: ["⇧", "Z"], description: "Redo palette change", scope: "Colors" },
  { keys: ["F"], description: "Focus font search", scope: "Typography" },
  { keys: ["F"], description: "Focus icon search", scope: "Icons" },
  { keys: ["R"], description: "Rotate icon 90° clockwise", scope: "Icons" },
  { keys: ["⇧", "R"], description: "Rotate icon 90° counter-clockwise", scope: "Icons" },
  { keys: ["Space"], description: "Random font pair (Pairing tab)", scope: "Typography" },
  { keys: ["Space"], description: "New random seed", scope: "Backgrounds" },
  { keys: ["]"], description: "Next template", scope: "Mockups" },
  { keys: ["["], description: "Previous template", scope: "Mockups" },
  { keys: ["]"], description: "Next template", scope: "Social" },
  { keys: ["["], description: "Previous template", scope: "Social" },
];
