"use client";

import { FileUp } from "lucide-react";
import { useRef } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { errorMessage, translateLocalized } from "@/lib/i18n/errors";
import type { ImportedTokens } from "@/lib/brand/import-tokens";
import { createStop } from "@/lib/color/gradient";
import { loadFontIndex } from "@/lib/typography/catalog";
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
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);

  async function importFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) {
      toast.error(t("brand.import.tooLarge"));
      return;
    }
    try {
      // The parser and snapshots load with the file, so they stay out of the page's first load.
      const [text, catalog, { parseTokensFile, summarizeImport }, { applySnapshot, captureSnapshot }, { checkpoint }] =
        await Promise.all([
          file.text(),
          loadFontIndex(),
          import("@/lib/brand/import-tokens"),
          import("@/lib/projects/snapshot"),
          import("@/lib/projects/versions"),
        ]);
      const families = new Set(catalog.map((font) => font.family));
      const imported = parseTokensFile(text, { isKnownFont: (family) => families.has(family) });
      const before = captureSnapshot();
      applyImport(imported);
      void checkpoint("token-import", before);
      toast.success(t("brand.import.done"), {
        description: [...summarizeImport(imported), ...imported.notes]
          .map((line) => translateLocalized(t, line))
          .join(" · "),
        action: { label: t("common.undo"), onClick: () => applySnapshot(before) },
      });
    } catch (error) {
      toast.error(errorMessage(error, t, "brand.import.failed"), {
        description: t("share.import.nothingChanged"),
      });
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-auto min-h-9 w-full whitespace-normal py-1.5"
        onClick={() => fileRef.current?.click()}
        title={t("brand.import.hint")}
      >
        <FileUp /> {t("brand.import.button")}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-label={t("brand.import.fileLabel")}
        onChange={(event) => {
          void importFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </>
  );
}
