"use client";

import "@/lib/i18n/areas/colors";

import { useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toHex } from "@/lib/color/color";
import { apcaLevelRank, matrixCell, type MatrixMode } from "@/lib/color/matrix";
import { paletteNames } from "@/lib/color/names";
import { useColorStore } from "@/store/color-store";
import { useMatrixModeStore } from "@/store/matrix-mode-store";

/** Every palette pairing at a glance, as WCAG 2 ratios or APCA Lc values. Click a cell to inspect it above. */
export function ContrastMatrix() {
  const { t } = useI18n();
  const swatches = useColorStore((state) => state.swatches);
  const setContrast = useColorStore((state) => state.setContrast);
  const mode = useMatrixModeStore((state) => state.mode);
  const setMode = useMatrixModeStore((state) => state.setMode);
  const names = useMemo(() => paletteNames(swatches.map((swatch) => swatch.color)), [swatches]);

  return (
    <section aria-labelledby="matrix-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="matrix-title" className="text-lg font-medium">
          {t("colors.matrix.title")}
        </h2>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && setMode(value as MatrixMode)}
          aria-label={t("colors.matrix.mode")}
        >
          <ToggleGroupItem value="wcag">{t("colors.matrix.wcag")}</ToggleGroupItem>
          <ToggleGroupItem value="apca">{t("colors.matrix.apca")}</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="overflow-x-auto rounded-lg border scrollbar-thin">
        <table data-user-colors="" className="w-full border-collapse text-xs">
          <caption className="sr-only">
            {t("colors.matrix.caption")} {mode === "apca" ? t("colors.matrix.apcaCaption") : ""}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="p-2 text-left font-medium text-subtle-foreground">
                {t("colors.matrix.corner")}
              </th>
              {swatches.map((swatch, index) => (
                <th key={swatch.id} scope="col" className="p-2">
                  <span className="flex items-center justify-center gap-1.5 font-medium capitalize">
                    <span className="size-3 rounded-sm border" style={{ background: toHex(swatch.color) }} />
                    {names[index]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {swatches.map((row, rowIndex) => (
              <tr key={row.id} className="border-t">
                <th scope="row" className="p-2 text-left font-medium capitalize">
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm border" style={{ background: toHex(row.color) }} />
                    {names[rowIndex]}
                  </span>
                </th>
                {swatches.map((column) => {
                  const same = row.id === column.id;
                  const cell = matrixCell(row.color, column.color, mode);
                  const rating =
                    cell.mode === "wcag"
                      ? t(`colors.rating.${cell.level}` as const)
                      : t(`colors.matrix.level.${cell.level}` as const);
                  return (
                    <td key={column.id} className="p-1">
                      {same ? (
                        <span className="block text-center text-subtle-foreground">-</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setContrast({ fg: row.color, bg: column.color })}
                          aria-label={t(cell.mode === "wcag" ? "colors.matrix.cell" : "colors.matrix.apcaCell", {
                            text: names[rowIndex] ?? "",
                            background: names[swatches.indexOf(column)] ?? "",
                            ratio: cell.value,
                            rating,
                          })}
                          className="flex h-12 w-full min-w-20 flex-col items-center justify-center rounded-md transition-transform duration-150 hover:scale-[1.03]"
                          style={{ background: toHex(column.color), color: toHex(row.color) }}
                        >
                          <span className="text-sm font-semibold tabular-nums">{cell.value}</span>{" "}
                          <span className="text-[10px] opacity-80">{rating}</span>
                          {cell.mode === "apca" ? (
                            <span aria-hidden className="mt-0.5 flex gap-0.5">
                              {[1, 2, 3, 4].map((step) => (
                                <span
                                  key={step}
                                  className="h-0.5 w-3 rounded-full bg-current"
                                  style={{ opacity: step <= apcaLevelRank[cell.level] ? 1 : 0.25 }}
                                />
                              ))}
                            </span>
                          ) : null}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
