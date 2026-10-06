"use client";

import { ChevronsUpDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FontFamily } from "@/types/typography";

const loadList = () => import("@/components/typography/font-picker-list").then((m) => m.FontPickerList);

// The search list (cmdk) is only needed once the picker opens.
const FontPickerList = dynamic(loadList, {
  ssr: false,
  loading: () => <div className="h-12" aria-hidden />,
});

type FontPickerProps = {
  label: string;
  value: string;
  fonts: FontFamily[];
  onChange: (family: string) => void;
  className?: string;
};

/** Searchable font combobox. Filtering is done up-front so large lists stay fast. */
export function FontPicker({ label, value, fonts, onChange, className }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`${label}: ${value}`}
          className={cn("w-full justify-between font-normal", className)}
          // Start fetching the list as soon as the picker is about to open.
          onPointerEnter={() => void loadList()}
          onFocus={() => void loadList()}
        >
          <span className="truncate">{value}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <FontPickerList
          label={label}
          value={value}
          fonts={fonts}
          query={query}
          onQueryChange={setQuery}
          onSelect={(family) => {
            onChange(family);
            setOpen(false);
            setQuery("");
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
