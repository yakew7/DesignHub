"use client";

import { StudioLink as Link } from "@/components/layout/studio-link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { toast } from "@/lib/toast";
import { BookOpen, ChevronDown, Home, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { GithubIcon } from "@/components/layout/github-icon";
import { useI18n } from "@/components/layout/locale-provider";

import { useKeptStudios } from "@/hooks/use-kept-studios";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isGroupOpen } from "@/lib/nav-groups";
import { isActivePath, studioGroups, studios } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useNavStore } from "@/store/nav-store";

type SidebarNavProps = {
  onNavigate?: () => void;
  /** Show only icons, with each name as a label. Used by the desktop sidebar when it is collapsed. */
  compact?: boolean;
  /** Adds the collapse button. Only the desktop sidebar passes it; the sheet menu on a phone does not. */
  onToggleCollapsed?: () => void;
};

const itemClass =
  "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground";

const compactClass = "size-8 justify-center px-0";

/** On the collapsed rail a name is a tooltip, shown on hover and on keyboard focus, which `title` is not. */
function RailTip({ show, text, children }: { show: boolean; text: string; children: ReactNode }) {
  if (!show) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{text}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarNav({ onNavigate, compact = false, onToggleCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const folded = useNavStore((state) => state.folded);
  const toggle = useNavStore((state) => state.toggle);
  const { kept, offline } = useKeptStudios();
  // Offline, a studio that was never opened with a connection cannot open: say so instead of showing an error page.
  const guard = (href: string) => (event: MouseEvent) => {
    if (offline && !kept.has(href)) {
      event.preventDefault();
      toast(t("nav.notKept"));
    }
  };

  return (
    <nav
      aria-label={t("nav.studios")}
      className={cn("flex h-full flex-col gap-5 overflow-y-auto p-3 scrollbar-thin", compact && "items-center px-2")}
    >
      {onToggleCollapsed ? (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-pressed={compact}
          aria-label={t(compact ? "nav.expand" : "nav.collapse")}
          title={`${t(compact ? "nav.expand" : "nav.collapse")} (Ctrl/⌘ B)`}
          className={cn(itemClass, "w-full", compact && "justify-center px-0")}
        >
          {compact ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden />
          )}
          {compact ? null : <span className="flex-1 text-left">{t("nav.collapse")}</span>}
        </button>
      ) : null}
      <div className="flex flex-col gap-0.5">
        <RailTip show={compact} text={t("nav.home")}>
          <Link
            href="/"
            onClick={onNavigate}
            aria-current={pathname === "/" ? "page" : undefined}
            aria-label={compact ? t("nav.home") : undefined}
            className={cn(itemClass, compact && compactClass, pathname === "/" && "bg-accent text-foreground")}
          >
            <Home className="size-4" aria-hidden />
            {compact ? null : t("nav.home")}
          </Link>
        </RailTip>
      </div>

      {studioGroups.map((group) => {
        // A collapsed sidebar has no room for group names, so every group is open and set apart by a line.
        const open = compact || isGroupOpen(group, folded, pathname);
        const listId = `nav-group-${group.toLowerCase()}`;
        return (
          <div key={group} className={cn("flex flex-col gap-0.5", compact && "w-full border-t pt-3")}>
            {compact ? null : (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                onClick={() => toggle(group)}
                className="flex items-center justify-between rounded-md px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-subtle-foreground transition-colors duration-150 hover:text-foreground"
              >
                {t(`nav.group.${group}`)}
                <ChevronDown
                  className={cn("size-3 transition-transform duration-150", !open && "-rotate-90")}
                  aria-hidden
                />
              </button>
            )}
            <div id={listId} hidden={!open} className={cn("flex flex-col gap-0.5", compact && "items-center")}>
              {studios
                .filter((studio) => studio.group === group)
                .map((studio) => {
                  const active = isActivePath(pathname, studio.href);
                  const Icon = studio.icon;
                  const name = t(`studio.${studio.id}.short`);
                  return (
                    <RailTip key={studio.id} show={compact} text={`${name} (G ${studio.shortcut.toUpperCase()})`}>
                      <Link
                        href={studio.href}
                        onClick={(event) => {
                          guard(studio.href)(event);
                          if (!event.defaultPrevented) onNavigate?.();
                        }}
                        aria-current={active ? "page" : undefined}
                        aria-label={compact ? name : undefined}
                        className={cn(itemClass, compact && compactClass, active && "bg-accent text-foreground")}
                      >
                        <Icon className={cn("size-4", active && "text-brand")} aria-hidden />
                        {compact ? null : (
                          <>
                            <span className="flex-1 truncate">{name}</span>
                            <span className="hidden items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 lg:flex">
                              <Kbd>G</Kbd>
                              <Kbd>{studio.shortcut.toUpperCase()}</Kbd>
                            </span>
                          </>
                        )}
                        {kept.has(studio.href) ? (
                          <span
                            role="img"
                            aria-label={t("nav.kept")}
                            title={t("nav.kept")}
                            data-kept
                            className={cn(
                              "size-1.5 shrink-0 rounded-full bg-success",
                              compact && "absolute top-1 right-1",
                            )}
                          />
                        ) : null}
                      </Link>
                    </RailTip>
                  );
                })}
            </div>
          </div>
        );
      })}

      <div className={cn("mt-auto flex flex-col gap-0.5", compact && "w-full items-center border-t pt-3")}>
        {compact ? null : (
          <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-subtle-foreground">
            {t("nav.resources")}
          </p>
        )}
        <RailTip show={compact} text="GitHub">
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            aria-label={compact ? "GitHub" : undefined}
            className={cn(itemClass, compact && compactClass)}
          >
            <GithubIcon />
            {compact ? null : "GitHub"}
          </a>
        </RailTip>
        <RailTip show={compact} text={t("nav.roadmap")}>
          <a
            href={`${siteConfig.github}/blob/main/ROADMAP.md`}
            target="_blank"
            rel="noreferrer"
            aria-label={compact ? t("nav.roadmap") : undefined}
            className={cn(itemClass, compact && compactClass)}
          >
            <BookOpen className="size-4" aria-hidden />
            {compact ? null : t("nav.roadmap")}
          </a>
        </RailTip>
        {compact ? null : <p className="px-2 pt-3 text-[11px] text-subtle-foreground">v{siteConfig.version} · MIT</p>}
      </div>
    </nav>
  );
}
