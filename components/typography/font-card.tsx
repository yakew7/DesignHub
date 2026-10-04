"use client";

import { memo, useEffect } from "react";

import { FavoriteFontButton } from "@/components/typography/favorite-button";
import { Badge } from "@/components/ui/badge";
import { useInView } from "@/hooks/use-in-view";
import { fontCategoryLabels, isVariableFont } from "@/lib/typography/catalog";
import { fontStack } from "@/lib/typography/css";
import { googleFontsCssUrl, injectStylesheet } from "@/lib/typography/google-fonts";
import { cn } from "@/lib/utils";
import type { FontFamily } from "@/types/typography";

type FontCardProps = {
  font: FontFamily;
  active: boolean;
  onSelect: (family: string) => void;
};

/**
 * One option in the font listbox: the family name set in its own typeface, plus its details.
 * The listbox owns keyboard focus, so nothing in here is a tab stop.
 */
export const FontCard = memo(function FontCard({ font, active, onSelect }: FontCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  useEffect(() => {
    // Only the glyphs we render are downloaded, so hundreds of previews stay cheap.
    if (inView) injectStylesheet(googleFontsCssUrl(font, { text: `Aa${font.family}`, weight: 400 }));
  }, [inView, font]);

  return (
    <div className="relative flex w-full">
      {/* Clicks only: the listbox handles Enter and the arrow keys for every row. */}
      <div
        ref={ref}
        onClick={() => onSelect(font.family)}
        className={cn(
          "flex w-full cursor-pointer min-w-0 flex-col gap-0.5 rounded-md border border-transparent py-2 pr-11 pl-3 text-left transition-[border-color,background-color] duration-150 hover:bg-surface-raised",
          active && "border-brand/60 bg-surface-raised",
        )}
      >
        <span className="truncate text-xl leading-tight" style={{ fontFamily: fontStack(font.family, font.category) }}>
          {font.family}
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {fontCategoryLabels[font.category]} · {font.weights.length} {font.weights.length === 1 ? "style" : "weights"}
          {isVariableFont(font) ? <Badge variant="brand">Variable</Badge> : null}
        </span>
      </div>
      <FavoriteFontButton family={font.family} tabIndex={-1} className="absolute top-1/2 right-2 -translate-y-1/2" />
    </div>
  );
});
