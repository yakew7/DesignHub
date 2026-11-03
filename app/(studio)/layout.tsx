import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { StudioTracker } from "@/components/layout/studio-tracker";
import { LazyFileLaunchImport, LazyProjectAutosave, LazyShareLinkImport } from "@/components/projects/lazy-autosave";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell withSidebar>
      <StudioTracker />
      <LazyProjectAutosave />
      <LazyShareLinkImport />
      <LazyFileLaunchImport />
      {children}
    </AppShell>
  );
}
