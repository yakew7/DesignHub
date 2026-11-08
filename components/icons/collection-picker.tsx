"use client";

import { Check, ChevronsUpDown, Library } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchCollections } from "@/lib/icons/iconify";
import { cn } from "@/lib/utils";
import type { IconCollection } from "@/types/icons";

/** Well-maintained sets surfaced as quick chips. Labels are static so the row never reflows on load. */
const popularCollections: { prefix: string; label: string }[] = [
  { prefix: "lucide", label: "Lucide" },
  { prefix: "tabler", label: "Tabler" },
  { prefix: "ph", label: "Phosphor" },
  { prefix: "solar", label: "Solar" },
  { prefix: "heroicons", label: "Heroicons" },
  { prefix: "mdi", label: "Material" },
  { prefix: "ri", label: "Remix" },
  { prefix: "iconoir", label: "Iconoir" },
  { prefix: "simple-icons", label: "Simple Icons" },
  { prefix: "logos", label: "Logos" },
];
const popularPrefixes = new Set(popularCollections.map((item) => item.prefix));

type CollectionPickerProps = {
  value: string | null;
  onChange: (prefix: string | null) => void;
};

export function CollectionPicker({ value, onChange }: CollectionPickerProps) {
  const { t, plural } = useI18n();
  const [collections, setCollections] = useState<Record<string, IconCollection>>({});
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchCollections()
      .then(setCollections)
      .catch(() => undefined);
  }, []);

  const list = useMemo(() => {
    const needle = query.toLowerCase();
    return Object.values(collections)
      .filter((item) => !needle || item.name.toLowerCase().includes(needle) || item.prefix.includes(needle))
      .sort((a, b) => b.total - a.total)
      .slice(0, 80);
  }, [collections, query]);

  const current = value ? collections[value] : undefined;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className="h-7 rounded-full border px-3 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground aria-pressed:border-brand/50 aria-pressed:text-foreground"
      >
        {t("icons.sets.all")}
      </button>
      {popularCollections.map(({ prefix, label }) => (
        <button
          key={prefix}
          type="button"
          onClick={() => onChange(prefix)}
          aria-pressed={value === prefix}
          className="h-7 rounded-full border px-3 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground aria-pressed:border-brand/50 aria-pressed:text-foreground"
        >
          {label}
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-full"
            role="combobox"
            aria-expanded={open}
            aria-label={t("icons.sets.browse")}
          >
            <Library />
            {current && !popularPrefixes.has(current.prefix) ? current.name : t("icons.sets.more")}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder={t("icons.sets.search")} />
            <CommandList className="max-h-80">
              <CommandEmpty>{t("icons.sets.empty")}</CommandEmpty>
              {list.map((item) => (
                <CommandItem
                  key={item.prefix}
                  value={item.prefix}
                  onSelect={() => {
                    onChange(item.prefix);
                    setOpen(false);
                  }}
                >
                  <Check className={cn(value === item.prefix ? "opacity-100" : "opacity-0")} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{item.name}</span>
                    <span className="truncate text-[11px] text-subtle-foreground">
                      {plural("icons.sets.count", item.total, {
                        license: item.license?.spdx ?? item.license?.title ?? "-",
                      })}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
