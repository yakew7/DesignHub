import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  /** Rendered next to the logo (e.g. the mobile menu trigger). */
  leading?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function SiteHeader({ leading, children, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:gap-4 sm:px-4 md:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {leading}
        <Logo />
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">{children}</div>
    </header>
  );
}
