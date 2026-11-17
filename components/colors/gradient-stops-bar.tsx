"use client";

import "@/lib/i18n/areas/colors";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { toHex } from "@/lib/color/color";
import { colorAt, createStop, gradientCssFallback } from "@/lib/color/gradient";
import { cn } from "@/lib/utils";
import type { Gradient } from "@/types/color";

type GradientStopsBarProps = {
  gradient: Gradient;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (gradient: Gradient) => void;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Horizontal editor for stop positions. Drag handles with the pointer, or focus
 * one and use ←/→ (Shift for 10%). Click the bar to add a stop.
 */
export function GradientStopsBar({ gradient, selectedId, onSelect, onChange }: GradientStopsBarProps) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);

  const positionFrom = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return clamp(((clientX - rect.left) / rect.width) * 100);
  };

  const move = (id: string, position: number) =>
    onChange({
      ...gradient,
      stops: gradient.stops.map((stop) => (stop.id === id ? { ...stop, position: clamp(position) } : stop)),
    });

  function addAt(event: PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || gradient.stops.length >= 8) return;
    const position = positionFrom(event.clientX);
    const stop = createStop(colorAt(gradient, position), position);
    onChange({ ...gradient, stops: [...gradient.stops, stop] });
    onSelect(stop.id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: string, position: number) {
    const delta = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") move(id, position - delta);
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") move(id, position + delta);
    else return;
    event.preventDefault();
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={trackRef}
        onPointerDown={addAt}
        className="relative h-8 cursor-copy rounded-md border"
        style={{ background: gradientCssFallback({ ...gradient, type: "linear", angle: 90 }) }}
        aria-label={t("colors.gradient.bar")}
        role="group"
      >
        {gradient.stops.map((stop) => (
          <button
            key={stop.id}
            type="button"
            role="slider"
            aria-label={t("colors.gradient.stop", { color: toHex(stop.color) })}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(stop.position)}
            aria-valuetext={`${Math.round(stop.position)}%`}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              dragging.current = stop.id;
              onSelect(stop.id);
            }}
            onPointerMove={(event) => {
              if (dragging.current === stop.id) move(stop.id, positionFrom(event.clientX));
            }}
            onPointerUp={() => {
              dragging.current = null;
            }}
            onFocus={() => onSelect(stop.id)}
            onKeyDown={(event) => onKeyDown(event, stop.id, stop.position)}
            className={cn(
              "absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-white shadow-md ring-1 ring-black/20 transition-transform duration-150 active:cursor-grabbing",
              stop.id === selectedId && "scale-125 ring-2 ring-foreground",
            )}
            style={{ left: `${stop.position}%`, background: toHex(stop.color) }}
          />
        ))}
      </div>
      <p className="text-[11px] text-subtle-foreground">{t("colors.gradient.barHint")}</p>
    </div>
  );
}
