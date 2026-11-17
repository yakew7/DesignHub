"use client";

import "@/lib/i18n/areas/colors";

import { m } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, Lock, Unlock, X } from "lucide-react";
import type { ReactNode } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { useCopy } from "@/hooks/use-copy";
import { formatColor, readableTextColor, toHex } from "@/lib/color/color";
import { cn } from "@/lib/utils";
import { MIN_SWATCHES, useColorStore } from "@/store/color-store";
import type { Swatch } from "@/types/color";

type SwatchColumnProps = {
  swatch: Swatch;
  name: string;
  index: number;
  total: number;
  selected: boolean;
};

function SwatchAction({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex size-8 items-center justify-center rounded-md opacity-70 transition-[opacity,background-color] duration-150 hover:bg-current/10 hover:opacity-100 focus-visible:opacity-100 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

export function SwatchColumn({ swatch, name, index, total, selected }: SwatchColumnProps) {
  const { t } = useI18n();
  const format = useColorStore((state) => state.format);
  const select = useColorStore((state) => state.select);
  const toggleLock = useColorStore((state) => state.toggleLock);
  const removeSwatch = useColorStore((state) => state.removeSwatch);
  const moveSwatch = useColorStore((state) => state.moveSwatch);
  const { copy } = useCopy();

  const hex = toHex(swatch.color);
  const text = toHex(readableTextColor(swatch.color));
  const value = formatColor(swatch.color, format);

  return (
    <m.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "group relative flex min-h-28 flex-1 flex-col justify-end md:min-h-0",
        selected && "md:flex-[1.35]",
      )}
      style={{ background: hex, color: text }}
    >
      <button
        type="button"
        onClick={() => select(swatch.id)}
        aria-pressed={selected}
        aria-label={t("colors.swatch.select", { name, value })}
        className="absolute inset-0 outline-none focus-visible:ring-4 focus-visible:ring-current/40 focus-visible:ring-inset"
      />
      <div className="pointer-events-none relative flex flex-col gap-3 p-4 md:items-center md:pb-8">
        <div className="pointer-events-auto flex flex-wrap gap-0.5 md:flex-col md:opacity-0 md:transition-opacity md:duration-150 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <SwatchAction
            label={t(swatch.locked ? "colors.swatch.unlock" : "colors.swatch.lock", { name })}
            onClick={() => toggleLock(swatch.id)}
          >
            {swatch.locked ? <Lock /> : <Unlock />}
          </SwatchAction>
          <SwatchAction
            label={t("colors.copyValue", { value })}
            onClick={() => copy(value, t("colors.copied", { value }))}
          >
            <Copy />
          </SwatchAction>
          {index > 0 ? (
            <SwatchAction label={t("colors.swatch.left", { name })} onClick={() => moveSwatch(swatch.id, -1)}>
              <ChevronLeft />
            </SwatchAction>
          ) : null}
          {index < total - 1 ? (
            <SwatchAction label={t("colors.swatch.right", { name })} onClick={() => moveSwatch(swatch.id, 1)}>
              <ChevronRight />
            </SwatchAction>
          ) : null}
          {total > MIN_SWATCHES ? (
            <SwatchAction label={t("colors.swatch.remove", { name })} onClick={() => removeSwatch(swatch.id)}>
              <X />
            </SwatchAction>
          ) : null}
        </div>
        {swatch.locked ? <Lock className="size-4 md:hidden" aria-hidden /> : null}
        <div className="flex flex-col md:items-center">
          <span className="font-mono text-sm font-medium tracking-tight uppercase md:text-base">
            {hex.replace("#", "")}
          </span>
          <span className="text-xs">{name}</span>
          {format !== "hex" ? <span className="mt-1 font-mono text-[11px] opacity-90">{value}</span> : null}
        </div>
      </div>
    </m.li>
  );
}
