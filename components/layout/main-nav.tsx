"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/layout/locale-provider";
import { isActivePath, studios } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav aria-label={t("nav.main")} className={cn("hidden items-center gap-1 lg:flex", className)}>
      {studios
        .filter((studio) => studio.group !== "Tools")
        .slice(0, 6)
        .map((studio, index) => {
          const active = isActivePath(pathname, studio.href);
          return (
            <Link
              key={studio.id}
              href={studio.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground",
                // Below xl the header can't fit six labels next to search, language and theme in every language.
                index >= 4 && "max-xl:hidden",
                active && "text-foreground",
              )}
            >
              {t(`studio.${studio.id}.short`)}
            </Link>
          );
        })}
    </nav>
  );
}
