"use client";

import { ArrowLeftRight, Columns2, Pin, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useFontMeta } from "@/hooks/use-font-catalog";
import { useGoogleFont } from "@/hooks/use-google-font";
import { nearestWeight } from "@/lib/typography/compare";
import { fontStack, fontVariationSettings, openTypeFeatureSettings } from "@/lib/typography/css";
import { cn } from "@/lib/utils";
import { useTypographyStore } from "@/store/typography-store";

type PaneProps = {
  family: string;
  /** Column label, shown only while comparing. */
  label?: string;
  textId: string;
  /** Variable axes belong to the active font, so the pinned side ignores them. */
  useAxes: boolean;
  actions?: ReactNode;
};

/** One font shown with the shared specimen text and settings. */
function SpecimenPane({ family, label, textId, useAxes, actions }: PaneProps) {
  const specimen = useTypographyStore((state) => state.specimen);
  const openType = useTypographyStore((state) => state.openType);
  const updateSpecimen = useTypographyStore((state) => state.updateSpecimen);
  const meta = useFontMeta(family);
  useGoogleFont(meta);

  const weight = nearestWeight(meta, specimen.weight);
  const style: CSSProperties = {
    fontFamily: fontStack(family, meta?.category),
    fontSize: `${specimen.size}px`,
    fontWeight: weight,
    fontStyle: specimen.italic ? "italic" : "normal",
    letterSpacing: `${specimen.letterSpacing}em`,
    lineHeight: specimen.lineHeight,
    fontFeatureSettings: openTypeFeatureSettings(openType),
    fontVariationSettings: useAxes ? fontVariationSettings(specimen.axes) : undefined,
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-2">
          {label && <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">{label}</span>}
          <span className="truncate font-medium text-foreground">{family}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-mono tabular-nums">
            {specimen.size}px · {weight} · {specimen.lineHeight.toFixed(2)} / {specimen.letterSpacing.toFixed(2)}em
          </span>
          {actions}
        </span>
      </div>
      {weight !== specimen.weight && (
        <p role="status" className="-mt-2 text-xs text-muted-foreground">
          {family} has no {specimen.weight} weight, so this side shows {weight}.
        </p>
      )}
      <label htmlFor={textId} className="sr-only">
        Preview text{label ? `, ${label}` : ""}
      </label>
      <textarea
        id={textId}
        value={specimen.text}
        onChange={(event) => updateSpecimen({ text: event.target.value })}
        spellCheck={false}
        rows={3}
        style={style}
        className="max-h-[40dvh] w-full flex-1 resize-none overflow-y-auto bg-transparent break-words outline-none scrollbar-thin [field-sizing:content]"
      />
    </div>
  );
}

/** Large, editable specimen for the active font, optionally next to a pinned second font. */
export function SpecimenPreview({ className }: { className?: string }) {
  const activeFont = useTypographyStore((state) => state.activeFont);
  const compareFont = useTypographyStore((state) => state.compareFont);
  const setCompareFont = useTypographyStore((state) => state.setCompareFont);
  const startCompare = useTypographyStore((state) => state.startCompare);
  const swapCompare = useTypographyStore((state) => state.swapCompare);
  const comparing = compareFont !== null;

  return (
    <div className={cn("flex min-h-44 flex-col gap-4 rounded-lg border bg-card p-6", className)}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {comparing && (
          <Button variant="ghost" size="sm" onClick={swapCompare}>
            <ArrowLeftRight /> Swap
          </Button>
        )}
        <Button
          variant={comparing ? "secondary" : "outline"}
          size="sm"
          aria-pressed={comparing}
          onClick={() => (comparing ? setCompareFont(null) : startCompare())}
        >
          {comparing ? <X /> : <Columns2 />} {comparing ? "Close compare" : "Compare"}
        </Button>
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col gap-6", comparing && "sm:flex-row sm:gap-8")}>
        <SpecimenPane
          family={activeFont}
          label={comparing ? "Active" : undefined}
          textId="specimen-text"
          useAxes
          actions={
            comparing ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Pin ${activeFont} to the second column`}
                title="Pin to the second column"
                onClick={() => setCompareFont(activeFont)}
              >
                <Pin />
              </Button>
            ) : undefined
          }
        />
        {compareFont && (
          <SpecimenPane family={compareFont} label="Pinned" textId="specimen-text-compare" useAxes={false} />
        )}
      </div>
    </div>
  );
}
