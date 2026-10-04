"use client";

import dynamic from "next/dynamic";

/** Loaded after hydration so the stores it watches never delay first paint. */
export const LazyProjectAutosave = dynamic(
  () => import("@/components/projects/project-autosave").then((m) => m.ProjectAutosave),
  { ssr: false },
);

/** Share links are rare, so their handler loads after hydration too. */
export const LazyShareLinkImport = dynamic(
  () => import("@/components/projects/share-link-import").then((m) => m.ShareLinkImport),
  { ssr: false },
);
