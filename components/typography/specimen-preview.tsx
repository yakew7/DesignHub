"use client";

import "@/lib/i18n/areas/projects";

import { ArrowLeftRight, Columns2, Languages, Pin, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { weightName } from "@/components/typography/weight-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFontMeta } from "@/hooks/use-font-catalog";
import { useGoogleFont } from "@/hooks/use-google-font";
import { familyWeightRows, nearestWeight } from "@/lib/typography/compare";
import { fontStack, fontVariationSettings, openTypeFeatureSettings } from "@/lib/typography/css";
import { matchSample, needsExtendedGlyphs, specimenSamples } from "@/lib/typography/samples";
import { cn } from "@/lib/utils";
import { useTypographyStore } from "@/store/typography-store";

const FALLBACK_STRIP_TEXT = "The quick brown fox jumps over the lazy dog";

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

/** One line per available weight (or named instance) using the specimen sample text. */
function WeightComparisonStrip({ family }: { family: string }) {
  const { t } = useI18n();
  const specimen = useTypographyStore((state) => state.specimen);
  const openType = useTypographyStore((state) => state.openType);
  const updateSpecimen = useTypographyStore((state) => state.updateSpecimen);
  const meta = useFontMeta(family);
  useGoogleFont(meta);

  const rows = familyWeightRows(meta);
  const text = specimen.text.split("\n").find((line) => line.trim()) ?? FALLBACK_STRIP_TEXT;
  const stack = fontStack(family, meta?.category);

  return (
    <div role="group" aria-label={`${family} weight comparison`} className="flex flex-col gap-1 border-t pt-4">
      <p className="text-xs font-medium text-muted-foreground">Weight comparison</p>
      <div className="-mx-1 flex flex-col">
        {rows.map(({ weight, name }) => {
          const selected = weight === specimen.weight;
          return (
            <button
              key={weight}
              type="button"
              aria-pressed={selected}
              onClick={() => updateSpecimen({ weight })}
              className={cn(
                "grid h-10 grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 rounded-md px-1 text-left transition-colors duration-150 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-accent",
              )}
            >
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums text-muted-foreground",
                  selected && "text-foreground",
                )}
              >
                {weight}
                {/* The button is named by its text: the number, and the weight's name for screen readers. */}
                <span className="sr-only"> {weightName(t, weight, name)}</span>
              </span>
              <span
                aria-hidden
                className="block overflow-hidden text-[22px] leading-8 text-ellipsis whitespace-nowrap"
                style={{
                  fontFamily: stack,
                  fontWeight: weight,
                  fontStyle: specimen.italic ? "italic" : "normal",
                  fontFeatureSettings: openTypeFeatureSettings(openType),
                }}
              >
                {text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CUSTOM = "custom";

/** Swaps the specimen text for a sample in another language or script. */
function SampleMenu() {
  const text = useTypographyStore((state) => state.specimen.text);
  const applySample = useTypographyStore((state) => state.applySample);
  const current = matchSample(text);

  return (
    <Select value={current?.id ?? CUSTOM} onValueChange={(id) => id !== CUSTOM && applySample(id)}>
      <SelectTrigger
        size="sm"
        className="w-auto min-w-40 max-w-full [&>span]:flex-1 [&>span]:truncate [&>span]:text-left"
        aria-label="Sample text"
      >
        <Languages />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {specimenSamples.map((sample) => (
          <SelectItem key={sample.id} value={sample.id}>
            {sample.label}
          </SelectItem>
        ))}
        <SelectItem value={CUSTOM} disabled>
          Your own text
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

/** Large, editable specimen for the active font, optionally next to a pinned second font. */
export function SpecimenPreview({ className }: { className?: string }) {
  const { t } = useI18n();
  const activeFont = useTypographyStore((state) => state.activeFont);
  const compareFont = useTypographyStore((state) => state.compareFont);
  const setCompareFont = useTypographyStore((state) => state.setCompareFont);
  const startCompare = useTypographyStore((state) => state.startCompare);
  const swapCompare = useTypographyStore((state) => state.swapCompare);
  const extended = useTypographyStore((state) => needsExtendedGlyphs(state.specimen.text));
  const comparing = compareFont !== null;

  return (
    <div className={cn("flex min-h-44 flex-col gap-4 rounded-lg border bg-card p-6", className)}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SampleMenu />
        <span className="flex-1" />
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
          {comparing ? <X /> : <Columns2 />} {comparing ? t("typography.compare.close") : t("projects.compare")}
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
      {extended && (
        <p className="text-xs text-muted-foreground">
          Characters a font doesn&apos;t include fall back to another font, so check the shapes before you choose it.
        </p>
      )}
      <WeightComparisonStrip family={activeFont} />
    </div>
  );
}
