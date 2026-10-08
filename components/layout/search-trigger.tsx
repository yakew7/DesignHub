"use client";

import { Search } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

export function SearchTrigger({ className }: { className?: string }) {
  const openCommand = useUiStore((state) => state.openCommand);
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={() => openCommand()}
      className={cn(
        "flex h-8 items-center gap-2 rounded-md border bg-surface px-2.5 text-sm text-subtle-foreground transition-colors duration-150 hover:border-border-strong hover:text-muted-foreground",
        className,
      )}
    >
      <Search className="size-3.5" aria-hidden />
      <span className="hidden sm:inline">{t("search.button")}</span>
      <span className="sr-only sm:hidden">{t("search.open")}</span>
      <Kbd className="ml-4 hidden sm:inline-flex">⌘K</Kbd>
    </button>
  );
}
