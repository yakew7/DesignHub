import type { ReactNode } from "react";

import { GlobalShortcuts } from "@/components/layout/global-shortcuts";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type AppShellProps = {
  /** Show the persistent studio sidebar on large screens. */
  withSidebar?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
};

/**
 * Two-row shell: sticky header on top, optional sidebar + main column below.
 * Below `lg` the sidebar moves into a sheet opened from the header.
 */
export function AppShell({ withSidebar = false, headerActions, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <GlobalShortcuts />
      <SiteHeader leading={<MobileNav />}>
        {withSidebar ? null : <MainNav className="mr-2" />}
        <SearchTrigger />
        {headerActions}
        <LanguageSwitcher />
        <ThemeToggle />
      </SiteHeader>
      <div className="flex flex-1">
        {withSidebar ? (
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 border-r lg:block">
            <SidebarNav />
          </aside>
        ) : null}
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
