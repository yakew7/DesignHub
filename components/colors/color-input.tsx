"use client";

import "@/lib/i18n/areas/colors";

import { useEffect, useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { formatColor, parseColor } from "@/lib/color/color";
import type { ColorFormat, Oklch } from "@/types/color";

type ColorInputProps = {
  format: ColorFormat;
  color: Oklch;
  onChange: (color: Oklch) => void;
  /** Keeps ids unique when several inputs share a page. */
  idPrefix?: string;
  label?: string;
};

/** Text field for one color notation. Accepts any CSS color on commit (Enter / blur). */
export function ColorInput({ format, color, onChange, idPrefix = "color-input", label }: ColorInputProps) {
  const { t } = useI18n();
  const formatted = formatColor(color, format);
  const [draft, setDraft] = useState(formatted);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(formatted);
    setInvalid(false);
  }, [formatted]);

  function commit() {
    if (draft === formatted) return;
    const parsed = parseColor(draft);
    if (parsed) onChange(parsed);
    else setInvalid(true);
  }

  const id = `${idPrefix}-${format}`;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="w-12 shrink-0 font-mono text-[11px] font-medium text-subtle-foreground uppercase">
        {label ?? format}
      </label>
      <Input
        id={id}
        value={draft}
        spellCheck={false}
        aria-invalid={invalid}
        onChange={(event) => {
          setDraft(event.target.value);
          setInvalid(false);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") setDraft(formatted);
        }}
        className="h-8 font-mono text-xs"
      />
      <CopyButton
        value={formatted}
        label={t("colors.input.copy", { format: format.toUpperCase() })}
        className="size-8"
        toastMessage={t("colors.copied", { value: formatted })}
      />
    </div>
  );
}
