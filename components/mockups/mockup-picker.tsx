"use client";

import { useHotkey } from "@/hooks/use-hotkeys";
import { mockupTemplates } from "@/lib/mockups/registry";
import { cn } from "@/lib/utils";
import { useMockupStore } from "@/store/mockup-store";

export function MockupPicker() {
  const template = useMockupStore((state) => state.template);
  const setTemplate = useMockupStore((state) => state.setTemplate);
  const categories = [...new Set(mockupTemplates.map((item) => item.category))];
  // Cycle in the order the picker shows them (grouped by category), wrapping at both ends.
  const ordered = categories.flatMap((category) => mockupTemplates.filter((item) => item.category === category));
  const cycle = (step: number) => {
    if (ordered.length === 0) return;
    const index = ordered.findIndex((item) => item.id === template);
    const next = ordered[(Math.max(index, 0) + step + ordered.length) % ordered.length];
    if (next) setTemplate(next.id);
  };
  useHotkey("]", () => cycle(1));
  useHotkey("[", () => cycle(-1));

  if (mockupTemplates.length === 0) {
    return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No templates yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.map((category) => (
        <div key={category} role="radiogroup" aria-label={category} className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-[0.12em] text-subtle-foreground uppercase">{category}</span>
          <div className="grid grid-cols-2 gap-1.5">
            {mockupTemplates
              .filter((item) => item.category === category)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={item.id === template}
                  title={item.description}
                  onClick={() => setTemplate(item.id)}
                  className={cn(
                    "flex h-9 min-w-0 items-center truncate rounded-md border px-2.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground",
                    item.id === template && "border-brand/60 bg-surface-raised text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
