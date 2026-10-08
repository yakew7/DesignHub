"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";

import { Panel } from "@/components/ui/panel";
import { visionModes, type PaletteColor, type PaletteVisionSection } from "@/lib/a11y/vision";
import { fromHex, toHex } from "@/lib/color/color";
import { simulateVision, type VisionType } from "@/lib/color/vision";
import { cn } from "@/lib/utils";
import type { VisionMode } from "@/types/a11y";

const simulated: Partial<Record<VisionMode, VisionType>> = {
  protanopia: "protanopia",
  deuteranopia: "deuteranopia",
  tritanopia: "tritanopia",
  grayscale: "achromatopsia",
};

const labelOf = (mode: VisionMode) => visionModes.find((entry) => entry.value === mode)?.label ?? mode;

/** One color as it is seen under the simulation, with its real hex for reference. */
function Seen({ color, type }: { color: PaletteColor; type: VisionType | undefined }) {
  const seen = type ? toHex(simulateVision(fromHex(color.hex), type)) : color.hex;
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-5 shrink-0 rounded-sm border" style={{ background: seen }} aria-hidden />
      <span className="text-xs">{color.name}</span>
    </span>
  );
}

/** Palette pairs that become too similar under each color vision deficiency, with a lightness fix. */
export function PaletteVisionResults({ section }: { section: PaletteVisionSection }) {
  return (
    <Panel
      title="Palette under color vision"
      description={`Each pair of brand colors after simulation. Below ${section.threshold} ΔE OK, chart series and status colors are hard to tell apart.`}
    >
      <ul className="flex flex-col gap-2" aria-label="Palette pairs by vision type">
        {section.modes.map((mode) => (
          <li
            key={mode.mode}
            className={cn(
              "flex flex-col gap-2 rounded-md border p-3",
              mode.pass ? "border-success/30" : "border-destructive/40",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{labelOf(mode.mode)}</span>
              {mode.pass ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Check className="size-4" aria-hidden /> All distinct
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <X className="size-4" aria-hidden /> {mode.pairs.length} {mode.pairs.length === 1 ? "pair" : "pairs"}{" "}
                  too close
                </span>
              )}
            </div>
            {mode.pairs.map((pair) => (
              <div key={`${pair.a.hex}-${pair.b.hex}`} className="flex flex-col gap-1 border-t pt-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Seen color={pair.a} type={simulated[mode.mode]} />
                  <span className="text-xs text-subtle-foreground">and</span>
                  <Seen color={pair.b} type={simulated[mode.mode]} />
                  <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-destructive">
                    {pair.distance.toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pair.suggestion ? (
                    <>
                      Change the lightness of {pair.suggestion.color} to{" "}
                      <span className="inline-flex items-center gap-1 font-mono">
                        <span
                          className="inline-block size-3 rounded-sm border align-middle"
                          style={{ background: pair.suggestion.to }}
                          aria-hidden
                        />
                        {pair.suggestion.to}
                      </span>{" "}
                      ({pair.suggestion.distance.toFixed(3)}).
                    </>
                  ) : (
                    "No lightness change separates these; pick a different hue."
                  )}
                </p>
              </div>
            ))}
          </li>
        ))}
      </ul>
      <Link href="/colors" className="self-end text-xs text-muted-foreground underline-offset-4 hover:underline">
        Edit the palette in Color Studio
      </Link>
    </Panel>
  );
}
