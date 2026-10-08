"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home } from "lucide-react";

import { GithubIcon } from "@/components/layout/github-icon";
import { useI18n } from "@/components/layout/locale-provider";

import { Kbd } from "@/components/ui/kbd";
import { isActivePath, studioGroups, studios } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  onNavigate?: () => void;
};

const itemClass =
  "group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground";

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav aria-label={t("nav.studios")} className="flex h-full flex-col gap-5 overflow-y-auto p-3 scrollbar-thin">
      <div className="flex flex-col gap-0.5">
        <Link
          href="/"
          onClick={onNavigate}
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(itemClass, pathname === "/" && "bg-accent text-foreground")}
        >
          <Home className="size-4" aria-hidden />
          {t("nav.home")}
        </Link>
      </div>

      {studioGroups.map((group) => (
        <div key={group} className="flex flex-col gap-0.5">
          <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-subtle-foreground">
            {t(`nav.group.${group}`)}
          </p>
          {studios
            .filter((studio) => studio.group === group)
            .map((studio) => {
              const active = isActivePath(pathname, studio.href);
              const Icon = studio.icon;
              return (
                <Link
                  key={studio.id}
                  href={studio.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(itemClass, active && "bg-accent text-foreground")}
                >
                  <Icon className={cn("size-4", active && "text-brand")} aria-hidden />
                  <span className="flex-1 truncate">{t(`studio.${studio.id}.short`)}</span>
                  <span className="hidden items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 lg:flex">
                    <Kbd>G</Kbd>
                    <Kbd>{studio.shortcut.toUpperCase()}</Kbd>
                  </span>
                </Link>
              );
            })}
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-0.5">
        <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-subtle-foreground">
          {t("nav.resources")}
        </p>
        <a href={siteConfig.github} target="_blank" rel="noreferrer" className={itemClass}>
          <GithubIcon />
          GitHub
        </a>
        <a href={`${siteConfig.github}/blob/main/ROADMAP.md`} target="_blank" rel="noreferrer" className={itemClass}>
          <BookOpen className="size-4" aria-hidden />
          {t("nav.roadmap")}
        </a>
        <p className="px-2 pt-3 text-[11px] text-subtle-foreground">v{siteConfig.version} · MIT</p>
      </div>
    </nav>
  );
}
