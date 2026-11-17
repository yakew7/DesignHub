"use client";

import "@/lib/i18n/areas/colors";

import { useI18n } from "@/components/layout/locale-provider";
import { toHex } from "@/lib/color/color";
import type { Oklch } from "@/types/color";

const SIZE = 160;
const RADIUS = 64;
const RING = Array.from({ length: 36 }, (_, index) => index * 10);

// Server and browser Math.cos can differ in the last digits; round to keep hydration stable.
const r2 = (value: number) => Math.round(value * 100) / 100;

/** Plots each palette color on an OKLCH hue wheel; distance from center is chroma. */
export function HarmonyWheel({ colors }: { colors: Oklch[] }) {
  const { t } = useI18n();
  const center = SIZE / 2;
  const point = (color: Oklch) => {
    const angle = ((color.h - 90) * Math.PI) / 180;
    const distance = Math.min(1, color.c / 0.25) * RADIUS;
    return { x: r2(center + Math.cos(angle) * distance), y: r2(center + Math.sin(angle) * distance) };
  };

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-40 shrink-0" role="img" aria-label={t("colors.harmony.wheel")}>
      {RING.map((hue) => {
        const start = ((hue - 90) * Math.PI) / 180;
        const end = ((hue + 10 - 90) * Math.PI) / 180;
        const r = RADIUS + 10;
        return (
          <path
            key={hue}
            d={`M ${r2(center + Math.cos(start) * r)} ${r2(center + Math.sin(start) * r)} A ${r} ${r} 0 0 1 ${r2(center + Math.cos(end) * r)} ${r2(center + Math.sin(end) * r)}`}
            stroke={`oklch(0.72 0.14 ${hue})`}
            strokeWidth={6}
            fill="none"
          />
        );
      })}
      <circle cx={center} cy={center} r={RADIUS} className="fill-none stroke-border" />
      {colors.map((color, index) => {
        const { x, y } = point(color);
        return (
          <g key={index}>
            <line x1={center} y1={center} x2={x} y2={y} className="stroke-border-strong" strokeWidth={1} />
            <circle cx={x} cy={y} r={7} fill={toHex(color)} className="stroke-background" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
}
