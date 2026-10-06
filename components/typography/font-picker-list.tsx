"use client";

import { Check } from "lucide-react";
import { useMemo } from "react";

import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { defaultFontFilters, filterFonts } from "@/lib/typography/filter";
import { fontCategoryLabels } from "@/lib/typography/catalog";
import { cn } from "@/lib/utils";
import type { FontFamily } from "@/types/typography";

type FontPickerListProps = {
  label: string;
  value: string;
  fonts: FontFamily[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (family: string) => void;
};

/** The list can mount after the popover opened, so it takes focus the way the popover would have. */
const focusOnMount = (input: HTMLInputElement | null) => input?.focus();

/** The searchable list inside the font picker's popover, loaded the first time it opens. */
export function FontPickerList({ label, value, fonts, query, onQueryChange, onSelect }: FontPickerListProps) {
  const results = useMemo(() => filterFonts(fonts, { ...defaultFontFilters, query }, []).slice(0, 60), [fonts, query]);

  return (
    <Command shouldFilter={false}>
      <CommandInput
        ref={focusOnMount}
        value={query}
        onValueChange={onQueryChange}
        placeholder={`Search ${label.toLowerCase()}…`}
      />
      <CommandList className="max-h-72">
        <CommandEmpty>No fonts found.</CommandEmpty>
        {results.map((font) => (
          <CommandItem key={font.family} value={font.family} onSelect={() => onSelect(font.family)}>
            <Check className={cn("size-4", font.family === value ? "opacity-100" : "opacity-0")} />
            <span className="truncate">{font.family}</span>
            <span className="ml-auto text-xs text-subtle-foreground">{fontCategoryLabels[font.category]}</span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
