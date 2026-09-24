"use client";

import { useState } from "react";
import { toast } from "sonner";

import { fromHex } from "@/lib/color/color";
import { palettePresets, paletteTags, type PaletteTag } from "@/lib/color/presets";
import { cn } from "@/lib/utils";
import { createSwatch, useColorStore } from "@/store/color-store";

/** Curated palettes to start from, filterable by mood. */
export function PaletteLibrary() {
  const setSwatches = useColorStore((state) => state.setSwatches);
  const undo = useColorStore((state) => state.undo);
  const [tag, setTag] = useState<PaletteTag | null>(null);
  const shown = tag ? palettePresets.filter((preset) => preset.tags.includes(tag)) : palettePresets;

  return (
    <section aria-labelledby="palette-library" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="palette-library" className="text-lg font-medium">
          Palette library
        </h2>
        <span className="text-xs text-subtle-foreground">{shown.length} palettes</span>
      </div>
      <div role="radiogroup" aria-label="Palette mood" className="flex flex-wrap gap-1.5">
        {[null, ...paletteTags].map((item) => (
          <button
            key={item ?? "all"}
            type="button"
            role="radio"
            aria-checked={tag === item}
            onClick={() => setTag(item)}
            className={cn(
              "h-7 rounded-full border px-3 text-xs text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground",
              tag === item && "border-brand/60 bg-surface-raised text-foreground",
            )}
          >
            {item ?? "All"}
          </button>
        ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((preset) => (
          <li key={preset.name} className="flex flex-col gap-2 rounded-lg border bg-card p-2">
            <button
              type="button"
              onClick={() => {
                setSwatches(preset.colors.map((hex) => createSwatch(fromHex(hex))));
                toast.success(`Loaded ${preset.name}`, { action: { label: "Undo", onClick: undo } });
              }}
              className="flex h-14 overflow-hidden rounded-md transition-transform duration-150 hover:scale-[1.02]"
              aria-label={`Load palette ${preset.name}`}
            >
              {preset.colors.map((hex) => (
                <span key={hex} className="flex-1" style={{ background: hex }} />
              ))}
            </button>
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="truncate text-xs">{preset.name}</span>
              <span className="shrink-0 text-[11px] text-subtle-foreground">{preset.tags.join(" · ")}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
