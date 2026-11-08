"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkeys";
import { useIconStore } from "@/store/icon-store";

export function IconSearch() {
  const { t } = useI18n();
  const query = useIconStore((state) => state.query);
  const setQuery = useIconStore((state) => state.setQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  useHotkey("f", () => inputRef.current?.focus());

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground"
        aria-hidden
      />
      <Input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setQuery("");
        }}
        placeholder={t("icons.search.placeholder")}
        aria-label={t("icons.search.label")}
        className="h-10 pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label={t("icons.search.clear")}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-subtle-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <Kbd className="absolute top-1/2 right-2 -translate-y-1/2">F</Kbd>
      )}
    </div>
  );
}
