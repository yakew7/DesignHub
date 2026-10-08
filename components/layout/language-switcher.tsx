"use client";

import { Languages } from "lucide-react";
import { useId } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { isLocale, localeNames, locales } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/** A native select: tiny, and keyboard and screen reader friendly on every platform. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const id = useId();

  return (
    <div className={cn("relative flex items-center", className)}>
      <label htmlFor={id} className="sr-only">
        {t("language.label")}
      </label>
      <Languages
        className="pointer-events-none absolute left-2 size-4 text-muted-foreground max-sm:hidden"
        aria-hidden
      />
      <select
        id={id}
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
        className="h-8 cursor-pointer appearance-none rounded-md bg-transparent px-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:pl-8"
      >
        {locales.map((item) => (
          <option key={item} value={item} lang={item}>
            {localeNames[item]}
          </option>
        ))}
      </select>
    </div>
  );
}
