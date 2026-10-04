"use client";

import { Check, RotateCcw, Wand2, X } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useFocusRing } from "@/hooks/use-focus-ring";
import { focusIndicatorCheck } from "@/lib/a11y/contrast";
import { formatRatio } from "@/lib/color/contrast";
import { cn } from "@/lib/utils";
import { useA11yStore } from "@/store/a11y-store";

export function FocusIndicatorResults() {
  const colors = useA11yStore((state) => state.colors);
  const setFocusRing = useA11yStore((state) => state.setFocusRing);
  const { ring, brandRing, fromBrand } = useFocusRing();
  const check = useMemo(() => focusIndicatorCheck(ring, colors.background, colors.accent), [ring, colors]);
  const ratios = [
    ["Against the page", check.backgroundRatio],
    ["Against the button", check.componentRatio],
  ] as const;

  return (
    <Panel
      title="Focus indicator"
      description="WCAG 2.2 · 2.4.13 (focus appearance) and 1.4.11. The ring needs 3:1 against the page and the focused button."
    >
      <div
        className={cn(
          "flex flex-col gap-3 rounded-md border p-3",
          check.pass ? "border-success/30" : "border-destructive/40",
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex shrink-0 items-center rounded-md p-2"
            style={{ background: colors.background }}
            aria-hidden
          >
            <span
              className="rounded-md px-3 py-1.5 text-xs font-semibold"
              style={{
                background: colors.accent,
                color: colors.onAccent,
                outline: `2px solid ${ring}`,
                outlineOffset: 2,
              }}
            >
              Focused
            </span>
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium">Focus ring</span>
            <span className="font-mono text-xs">{ring}</span>
            <span className="text-xs text-muted-foreground">
              {fromBrand ? "Brand primary" : `Fix (brand is ${brandRing})`}
            </span>
          </div>
          {check.pass ? (
            <Check className="size-4 text-success" aria-label="Pass" />
          ) : (
            <X className="size-4 text-destructive" aria-label="Fail" />
          )}
        </div>
        <ul className="flex flex-col gap-1" aria-label="Focus ring ratios">
          {ratios.map(([label, value]) => (
            <li key={label} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="flex items-center gap-2 font-mono">
                {formatRatio(value)}
                <Badge variant={value >= check.required ? "success" : "destructive"}>
                  {value >= check.required ? "3:1 ok" : "below 3:1"}
                </Badge>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {!check.pass && check.suggestion ? (
            <Button variant="outline" size="sm" onClick={() => setFocusRing(check.suggestion)}>
              <Wand2 /> Use {check.suggestion}
            </Button>
          ) : null}
          {fromBrand ? null : (
            <Button variant="ghost" size="sm" onClick={() => setFocusRing(null)}>
              <RotateCcw /> Back to brand ring
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
