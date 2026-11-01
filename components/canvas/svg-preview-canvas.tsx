"use client";

import { Maximize, Minus, Plus } from "lucide-react";
import { memo, useMemo, useState, type KeyboardEvent } from "react";

import { SvgComparison } from "@/components/canvas/svg-comparison";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useElementWidth } from "@/hooks/use-element-width";
import { useZoom } from "@/hooks/use-zoom";
import { svgToDataUrl } from "@/lib/icons/svg";
import { byteLength, formatBytes, svgDimensions } from "@/lib/svg-size";
import { cn } from "@/lib/utils";

type Backdrop = "checker" | "dark" | "light";

const backdrops: Record<Backdrop, string> = {
  checker: "bg-checker",
  dark: "bg-[#0e0e10]",
  light: "bg-white",
};

type SvgPreviewCanvasProps = {
  svg: string;
  /** When present, compare this result against svg using the same zoom and dimensions. */
  comparisonSvg?: string;
  label: string;
  /** Minimum height of the viewport. */
  minHeight?: number;
  defaultBackdrop?: Backdrop;
  className?: string;
};

/**
 * Zoomable, pannable preview for any SVG string. The SVG is shown through an
 * <img> data URL, so untrusted markup (uploads) can never run script.
 */
export const SvgPreviewCanvas = memo(function SvgPreviewCanvas({
  svg,
  comparisonSvg,
  label,
  minHeight = 320,
  defaultBackdrop = "checker",
  className,
}: SvgPreviewCanvasProps) {
  const { ref, width: viewportWidth } = useElementWidth<HTMLDivElement>();
  const { zoom, setZoom, step, fit } = useZoom();
  const [backdrop, setBackdrop] = useState<Backdrop>(defaultBackdrop);

  const src = useMemo(() => svgToDataUrl(svg), [svg]);
  const size = useMemo(() => svgDimensions(svg), [svg]);
  const bytes = useMemo(() => byteLength(svg), [svg]);

  const padding = 32;
  const fitScale = viewportWidth ? Math.min(1, (viewportWidth - padding * 2) / size.width) || 1 : 1;
  const scale = zoom ?? fitScale;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "+" || event.key === "=") step(1, scale);
    else if (event.key === "-") step(-1, scale);
    else if (event.key === "0") fit();
    else if (event.key === "1") setZoom(1);
    else return;
    event.preventDefault();
  }

  return (
    <figure className={cn("flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card", className)}>
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-2">
        <div className="flex items-center gap-0.5" role="toolbar" aria-label="Zoom">
          <Button variant="ghost" size="icon" className="size-7" aria-label="Zoom out" onClick={() => step(-1, scale)}>
            <Minus />
          </Button>
          <button
            type="button"
            onClick={() => (zoom === 1 ? fit() : setZoom(1))}
            className="h-7 min-w-14 rounded-sm px-1.5 font-mono text-xs tabular-nums text-muted-foreground hover:text-foreground"
            title="Toggle 100% / fit"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Zoom in" onClick={() => step(1, scale)}>
            <Plus />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Fit to view"
            aria-pressed={zoom === null}
            onClick={fit}
          >
            <Maximize />
          </Button>
        </div>
        <ToggleGroup
          type="single"
          value={backdrop}
          onValueChange={(value) => value && setBackdrop(value as Backdrop)}
          aria-label="Preview backdrop"
        >
          <ToggleGroupItem value="checker" aria-label="Transparent checkerboard">
            <span className="bg-checker size-3 rounded-[3px] border" />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark backdrop">
            <span className="size-3 rounded-[3px] border bg-[#0e0e10]" />
          </ToggleGroupItem>
          <ToggleGroupItem value="light" aria-label="Light backdrop">
            <span className="size-3 rounded-[3px] border bg-white" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        ref={ref}
        tabIndex={0}
        // Panning and zooming here use sideways touch moves, so a studio on a phone does not read them as a swipe.
        data-no-swipe
        role={comparisonSvg ? "region" : "img"}
        aria-label={`${label}. Use + and - to zoom, 0 to fit, 1 for 100%.`}
        onKeyDown={onKeyDown}
        className={cn(
          "relative flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          backdrops[backdrop],
        )}
        style={{ minHeight }}
      >
        <div className="flex min-h-full min-w-full items-center justify-center" style={{ padding }}>
          {/* Wait for the viewport to be measured so "fit" doesn't paint at full size first (layout shift). */}
          {viewportWidth || zoom !== null ? (
            comparisonSvg ? (
              <SvgComparison
                original={svg}
                optimized={comparisonSvg}
                width={size.width * scale}
                height={size.height * scale}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- SVG data URL
              <img
                src={src}
                alt=""
                draggable={false}
                className="block max-w-none shadow-sm"
                style={{ width: size.width * scale, height: size.height * scale }}
              />
            )
          ) : null}
        </div>
      </div>
      <figcaption className="flex h-8 shrink-0 items-center justify-between border-t px-3 font-mono text-[11px] text-subtle-foreground">
        <span>
          {Math.round(size.width)} × {Math.round(size.height)}
        </span>
        <span>{formatBytes(bytes)}</span>
      </figcaption>
    </figure>
  );
});
