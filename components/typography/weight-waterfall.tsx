"use client";

import { Panel } from "@/components/ui/panel";
import { availableWeights, weightNames } from "@/components/typography/weight-picker";
import { useFontMeta } from "@/hooks/use-font-catalog";
import { useGoogleFont } from "@/hooks/use-google-font";
import { useInView } from "@/hooks/use-in-view";
import { fontStack, openTypeFeatureSettings } from "@/lib/typography/css";
import { cn } from "@/lib/utils";
import { useTypographyStore } from "@/store/typography-store";

const FALLBACK_TEXT = "The quick brown fox jumps over the lazy dog";

/** The specimen text once per available weight. Click a row to use that weight. */
export function WeightWaterfall() {
  const activeFont = useTypographyStore((state) => state.activeFont);
  const specimen = useTypographyStore((state) => state.specimen);
  const openType = useTypographyStore((state) => state.openType);
  const updateSpecimen = useTypographyStore((state) => state.updateSpecimen);
  const meta = useFontMeta(activeFont);
  const { ref, inView } = useInView<HTMLDivElement>();
  // The browser only fetches the font files a rendered weight uses, so naming the family
  // in the rows only once they are near the viewport keeps the waterfall from loading early.
  useGoogleFont(inView ? meta : undefined);

  const weights = availableWeights(meta);
  const text = specimen.text.split("\n").find((line) => line.trim()) ?? FALLBACK_TEXT;
  const family = inView ? fontStack(activeFont, meta?.category) : undefined;

  return (
    <Panel title="Weight waterfall" description={`Every weight ${activeFont} ships. Click one to preview it.`}>
      <div ref={ref} role="group" aria-label={`${activeFont} weights`} className="-mx-2 flex flex-col">
        {weights.map((weight) => {
          const selected = weight === specimen.weight;
          return (
            <button
              key={weight}
              type="button"
              aria-pressed={selected}
              onClick={() => updateSpecimen({ weight })}
              className={cn(
                "grid h-12 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3 rounded-md px-2 text-left transition-colors duration-150 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-accent",
              )}
            >
              <span className="flex flex-col font-mono text-[11px] leading-tight text-muted-foreground tabular-nums">
                <span className={cn(selected && "text-foreground")}>{weight}</span>
                <span className="truncate font-sans">{weightNames[weight] ?? ""}</span>
              </span>
              {/* A fixed line box and clipped overflow mean a font swap can't move anything. */}
              <span
                className="block h-9 overflow-hidden text-[28px] leading-9 text-ellipsis whitespace-nowrap"
                style={{
                  fontFamily: family,
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
    </Panel>
  );
}
