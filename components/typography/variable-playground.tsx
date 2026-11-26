"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { useAxisAnimation } from "@/hooks/use-axis-animation";
import { useFontMeta } from "@/hooks/use-font-catalog";
import { axisName, axisStep } from "@/lib/typography/axes";
import { useTypographyStore } from "@/store/typography-store";
import type { FontAxis } from "@/types/typography";

export function VariablePlayground() {
  const { t } = useI18n();
  const activeFont = useTypographyStore((state) => state.activeFont);
  const specimen = useTypographyStore((state) => state.specimen);
  const updateSpecimen = useTypographyStore((state) => state.updateSpecimen);
  const setAxis = useTypographyStore((state) => state.setAxis);
  const meta = useFontMeta(activeFont);
  const axes = meta?.axes ?? [];

  const animation = useAxisAnimation((value, id) => {
    const activeAxis = id ?? animation.playing;
    if (activeAxis === "wght") updateSpecimen({ weight: value });
    else if (activeAxis) setAxis(activeAxis, value);
  });
  const { stop } = animation;

  // A new family has different axes; never keep animating the old one.
  useEffect(() => stop, [activeFont, stop]);

  if (axes.length === 0) return null;

  function valueOf(axis: FontAxis): number {
    return axis.tag === "wght" ? specimen.weight : (specimen.axes[axis.tag] ?? axis.default);
  }

  function change(axis: FontAxis, value: number) {
    if (axis.tag === "wght") updateSpecimen({ weight: value });
    else setAxis(axis.tag, value);
  }

  function reset() {
    stop();
    updateSpecimen({ axes: {}, weight: axes.find((axis) => axis.tag === "wght")?.default ?? 400 });
  }

  return (
    <Panel
      advanced
      collapsible
      id="typography-variable"
      title={t("typography.variable.title")}
      description={`${meta?.family} ships ${axes.length} ${axes.length === 1 ? "axis" : "axes"}. Drag or play to explore the design space.`}
      actions={
        <Button variant="ghost" size="icon" onClick={reset} aria-label={t("typography.variable.reset")}>
          <RotateCcw />
        </Button>
      }
    >
      {axes.map((axis) => {
        const playing = animation.playing === axis.tag;
        return (
          <div key={axis.tag} className="flex items-end gap-2">
            <SliderField
              className="flex-1"
              label={`${axisName(axis.tag)} · ${axis.tag}`}
              value={valueOf(axis)}
              min={axis.min}
              max={axis.max}
              step={axisStep(axis.min, axis.max)}
              onChange={(value) => {
                if (playing) stop();
                change(axis, value);
              }}
              format={(value) => (Number.isInteger(value) ? String(value) : value.toFixed(2))}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={playing ? `Pause ${axisName(axis.tag)} animation` : `Animate ${axisName(axis.tag)}`}
              aria-pressed={playing}
              onClick={() => (playing ? stop() : animation.play(axis.tag, axis.min, axis.max))}
            >
              {playing ? <Pause /> : <Play />}
            </Button>
          </div>
        );
      })}
    </Panel>
  );
}
