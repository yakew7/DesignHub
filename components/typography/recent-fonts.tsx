"use client";

import { History } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { useSelectFont } from "@/hooks/use-select-font";
import { useLibraryStore } from "@/store/library-store";
import { useTypographyStore } from "@/store/typography-store";
import { cn } from "@/lib/utils";

export function RecentFonts() {
  const { t } = useI18n();
  const recentFonts = useLibraryStore((state) => state.recentFonts);
  const clearRecentFonts = useLibraryStore((state) => state.clearRecentFonts);
  const activeFont = useTypographyStore((state) => state.activeFont);
  const selectFont = useSelectFont();

  if (recentFonts.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-subtle-foreground">
        <History className="size-3.5" aria-hidden /> {t("command.group.recent")}
      </span>
      <ul className="flex items-center gap-1.5" aria-label={t("typography.recent.label")}>
        {recentFonts.map((family) => (
          <li key={family}>
            <button
              type="button"
              onClick={() => selectFont(family)}
              className={cn(
                "h-7 shrink-0 whitespace-nowrap rounded-full border px-3 text-xs text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground",
                family === activeFont && "border-brand/50 text-foreground",
              )}
            >
              {family}
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="shrink-0 text-subtle-foreground" onClick={clearRecentFonts}>
        {t("typography.recent.clear")}
      </Button>
    </div>
  );
}
