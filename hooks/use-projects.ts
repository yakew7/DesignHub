"use client";

import { useCallback, useEffect, useState } from "react";

import { ensureInitialProject, saveActiveProject } from "@/lib/projects/actions";
import { listProjectItems, projectsPersist } from "@/lib/projects/repository";
import type { ProjectListItem } from "@/lib/projects/types";
import { useProjectStore } from "@/store/project-store";

export function useProjects() {
  const activeId = useProjectStore((state) => state.activeId);
  const [projects, setProjects] = useState<ProjectListItem[] | null>(null);
  const [persistent, setPersistent] = useState(true);

  const refresh = useCallback(async () => {
    setProjects(await listProjectItems());
    setPersistent(projectsPersist());
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      await ensureInitialProject();
      await saveActiveProject();
      if (active) await refresh();
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  /** Runs an action, then reloads the list. */
  const run = useCallback(
    async <T>(action: () => Promise<T>): Promise<T> => {
      const result = await action();
      await refresh();
      return result;
    },
    [refresh],
  );

  return { projects, activeId, persistent, refresh, run };
}
