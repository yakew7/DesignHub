"use client";

import { FileUp } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ImportedTokens } from "@/lib/brand/import-tokens";
import { createStop } from "@/lib/color/gradient";
import { loadFontCatalog } from "@/lib/typography/catalog";
import { createSwatch, useColorStore } from "@/store/color-store";
import { useTokensStore } from "@/store/tokens-store";
import { useTypographyStore } from "@/store/typography-store";

/** Writes each value into the store that owns it. The brand store is left alone. */
function applyImport(imported: ImportedTokens) {
  const colors = useColorStore.getState();
  if (imported.colors) colors.setSwatches(imported.colors.map((color) => createSwatch(color)));
  if (imported.gradient) {
    colors.setGradient({
      ...colors.gradient,
      stops: imported.gradient.map((stop) => createStop(stop.color, stop.position)),
    });
  }
  const typography = useTypographyStore.getState();
  typography.setPair({ heading: imported.headingFont ?? undefined, body: imported.bodyFont ?? undefined });
  typography.updateRhythm({
    ...(imported.headingWeight !== null ? { headingWeight: imported.headingWeight } : {}),
    ...(imported.bodyWeight !== null ? { bodyWeight: imported.bodyWeight } : {}),
  });
  useTokensStore.getState().update({
    ...(imported.radiusBase !== null ? { radiusBase: imported.radiusBase } : {}),
    ...(imported.spacingBase !== null ? { spacingBase: imported.spacingBase } : {}),
  });
}

/** Imports colors, fonts, radius and spacing from a DTCG tokens.json, with undo. */
export function ImportTokensButton() {
  const fileRef = useRef<HTMLInputElement>(null);

  async function importFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) {
      toast.error("That file is too large to be a tokens file.");
      return;
    }
    try {
      // The parser and snapshots load with the file, so they stay out of the page's first load.
      const [text, catalog, { parseTokensFile, summarizeImport }, { applySnapshot, captureSnapshot }, { checkpoint }] =
        await Promise.all([
          file.text(),
          loadFontCatalog(),
          import("@/lib/brand/import-tokens"),
          import("@/lib/projects/snapshot"),
          import("@/lib/projects/versions"),
        ]);
      const families = new Set(catalog.map((font) => font.family));
      const imported = parseTokensFile(text, { isKnownFont: (family) => families.has(family) });
      const before = captureSnapshot();
      applyImport(imported);
      void checkpoint("token-import", before);
      toast.success("Tokens imported", {
        description: `${[...summarizeImport(imported), ...imported.notes].join(". ")}.`,
        action: { label: "Undo", onClick: () => applySnapshot(before) },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import that file.", {
        description: "Nothing was changed.",
      });
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => fileRef.current?.click()}
        title="Import colors, fonts, radius and spacing from a DTCG tokens.json"
      >
        <FileUp /> Import tokens
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-label="Tokens file"
        onChange={(event) => {
          void importFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </>
  );
}
