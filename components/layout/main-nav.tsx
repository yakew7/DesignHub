"use client";

import { ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { StudioLink as Link } from "@/components/layout/studio-link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/layout/locale-provider";
import { isActivePath, studios } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Links shown in the header. Below xl the ones from this index on move into the More menu. */
const HEADER_LINKS = 6;
const VISIBLE_BELOW_XL = 4;

const loadMore = () => import("@/components/layout/main-nav-more");
// Radix's menu is only needed once someone opens More, so it stays out of the first load of every page that has the header.
const MainNavMore = dynamic(() => loadMore().then((m) => m.MainNavMore), { ssr: false });

/** The More trigger's look, shared by the plain button shown first and the menu's own trigger. */
const moreClass = (active: boolean) =>
  cn(
    "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground",
    "inline-flex items-center gap-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:text-foreground xl:hidden",
    active && "text-foreground",
  );

const linkClass =
  "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground";

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [more, setMore] = useState<{ ready: boolean; open: boolean; keyboard: boolean }>({
    ready: false,
    open: false,
    keyboard: false,
  });
  const links = studios.filter((studio) => studio.group !== "Tools").slice(0, HEADER_LINKS);
  const overflow = links.slice(VISIBLE_BELOW_XL);
  const overflowActive = overflow.some((studio) => isActivePath(pathname, studio.href));

  return (
    <nav aria-label={t("nav.main")} className={cn("hidden items-center gap-1 lg:flex", className)}>
      {links.map((studio, index) => {
        const active = isActivePath(pathname, studio.href);
        return (
          <Link
            key={studio.id}
            href={studio.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              linkClass,
              // Below xl the header can't fit six labels next to search, language and theme in every language.
              index >= VISIBLE_BELOW_XL && "max-xl:hidden",
              active && "text-foreground",
            )}
          >
            {t(`studio.${studio.id}.short`)}
          </Link>
        );
      })}
      {overflow.length ? (
        more.ready ? (
          <MainNavMore
            trigger={t("nav.more")}
            triggerClass={moreClass(overflowActive)}
            overflow={overflow}
            pathname={pathname}
            open={more.open}
            keyboard={more.keyboard}
            onOpenChange={(open) => setMore((current) => ({ ...current, ready: true, open }))}
          />
        ) : (
          // A plain button until the menu is first used; it is fetched as the button is about to be used.
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded="false"
            data-state="closed"
            className={moreClass(overflowActive)}
            onPointerEnter={() => void loadMore()}
            onFocus={() => void loadMore()}
            onKeyDown={(event) => {
              // Enter and Space also click, and ArrowDown opens it too: the menu then focuses its first item.
              if (["Enter", " ", "ArrowDown"].includes(event.key)) {
                event.preventDefault();
                setMore({ ready: true, open: true, keyboard: true });
              }
            }}
            onClick={() => setMore({ ready: true, open: true, keyboard: false })}
          >
            {t("nav.more")}
            <ChevronDown aria-hidden="true" className="size-3.5" />
          </button>
        )
      ) : null}
    </nav>
  );
}
