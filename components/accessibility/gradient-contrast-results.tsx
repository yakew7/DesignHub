"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { useGradientContrast } from "@/hooks/use-gradient-contrast";
import { GRADIENT_SAMPLES } from "@/lib/a11y/gradient-contrast";
import { formatRatio } from "@/lib/color/contrast";
import { gradientCss } from "@/lib/color/gradient";
import { cn } from "@/lib/utils";

export function GradientContrastResults() {
  const { gradient, results } = useGradientContrast();
  // Laid out flat from left to right, so the markers line up with the sampled positions.
  const strip = gradientCss({ ...gradient, type: "linear", angle: 90 });

  return (
    <Panel
      title="Text on the brand gradient"
      description={`WCAG 1.4.3. The lowest contrast of each text color across ${GRADIENT_SAMPLES} points of the gradient, sampled in ${gradient.interpolation}.`}
    >
      <div className="flex flex-col gap-1">
        <div className="relative my-1 h-8 rounded-md border" style={{ background: strip }} aria-hidden>
          {results.map((item) => (
            <span
              key={item.id}
              className="absolute -top-1 -bottom-1 w-1 -translate-x-1/2 rounded-full bg-current ring-1 ring-border-strong"
              style={{ left: `clamp(4px, ${item.worstPosition}%, calc(100% - 4px))`, color: item.color }}
            />
          ))}
        </div>
        <Link href="/colors" className="self-end text-xs text-muted-foreground underline-offset-4 hover:underline">
          Edit the gradient in Color Studio
        </Link>
      </div>
      <ul className="flex flex-col gap-2" aria-label="Gradient text checks">
        {results.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex flex-col gap-2 rounded-md border p-3",
              item.pass ? "border-success/30" : "border-destructive/40",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold"
                style={{ background: item.worstBackground, color: item.color }}
                aria-hidden
              >
                Aa
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{item.label}</span>
                <span className="font-mono text-xs text-muted-foreground">{item.color}</span>
              </div>
              {item.pass ? (
                <Check className="size-4 shrink-0 text-success" aria-label="Pass" />
              ) : (
                <X className="size-4 shrink-0 text-destructive" aria-label="Fail" />
              )}
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              Worst {formatRatio(item.worstRatio)} at {item.worstPosition}% on {item.worstBackground} · needs{" "}
              {item.required}:1
            </span>
            <div className="flex flex-wrap gap-1">
              <Badge variant={item.pass ? "success" : "destructive"}>AA</Badge>
              <Badge variant={item.passLarge ? "success" : "destructive"}>AA large</Badge>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
