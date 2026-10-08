"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toHex } from "@/lib/color/color";
import { createSwatch, useColorStore } from "@/store/color-store";
import { useLibraryStore, type SavedPalette } from "@/store/library-store";

export function SavedPalettes() {
  const palettes = useLibraryStore((state) => state.savedPalettes);
  const deletePalette = useLibraryStore((state) => state.deletePalette);
  const setSwatches = useColorStore((state) => state.setSwatches);

  async function load(palette: SavedPalette) {
    // Snapshots and history load on click, so they stay out of the studio's first load.
    const [{ captureSnapshot }, { checkpoint }] = await Promise.all([
      import("@/lib/projects/snapshot"),
      import("@/lib/projects/versions"),
    ]);
    const before = captureSnapshot();
    setSwatches(palette.colors.map((color) => createSwatch(color)));
    void checkpoint("palette", before);
  }

  if (palettes.length === 0) return null;

  return (
    <section aria-labelledby="saved-palettes" className="flex flex-col gap-4">
      <h2 id="saved-palettes" className="text-lg font-medium">
        Saved palettes
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {palettes.map((palette) => (
          <li key={palette.id} className="group flex flex-col gap-2 rounded-lg border bg-card p-2">
            <button
              type="button"
              onClick={() => void load(palette)}
              className="flex h-14 overflow-hidden rounded-md"
              aria-label={`Load palette ${palette.name}`}
            >
              {palette.colors.map((color, index) => (
                <span key={index} className="flex-1" style={{ background: toHex(color) }} />
              ))}
            </button>
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="truncate text-xs text-muted-foreground">{palette.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Delete palette ${palette.name}`}
                onClick={() => deletePalette(palette.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
