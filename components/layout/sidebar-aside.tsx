"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useHotkey } from "@/hooks/use-hotkeys";
import { cn } from "@/lib/utils";
import { useNavStore } from "@/store/nav-store";

/** The desktop sidebar: full width, or a narrow rail of icons when collapsed (Ctrl or ⌘ B, or its button). */
export function SidebarAside() {
  const collapsed = useNavStore((state) => state.collapsed);
  const toggleCollapsed = useNavStore((state) => state.toggleCollapsed);
  useHotkey("mod+b", toggleCollapsed, { allowInInputs: false });

  return (
    <aside
      data-sidebar
      className={cn(
        "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 border-r transition-[width] duration-150 lg:block",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <SidebarNav compact={collapsed} onToggleCollapsed={toggleCollapsed} />
    </aside>
  );
}
