"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { errorMessage } from "@/lib/i18n/errors";
import { importProjects } from "@/lib/projects/actions";
import {
  consumeLaunchQueue,
  launchSummary,
  readLaunchFiles,
  SHARE_PARAM,
  takeSharedFile,
  type LaunchHandle,
  type LaunchResult,
} from "@/lib/projects/launch";
import type { Translate } from "@/lib/i18n/translate";

function failureMessage(result: Extract<LaunchResult, { ok: false }>, t: Translate): string {
  if (result.reason === "unsupported") return t("launch.unsupported", { file: result.name });
  if (result.reason === "tooLarge") return t("launch.tooLarge", { file: result.name });
  return `${result.name}: ${errorMessage(result.error, t, "launch.invalid")}`;
}

/**
 * Opens project files the installed app is launched with (a double click on a `.designhub.json`
 * file, or a file shared from another app), checks them like a normal import, then asks before
 * adding them as new projects. A bad file changes nothing, and the open project is never replaced.
 */
export function FileLaunchImport() {
  const { t, plural } = useI18n();
  const [ready, setReady] = useState<Extract<LaunchResult, { ok: true }>[]>([]);
  const [busy, setBusy] = useState(false);
  // Read through a ref so a language change doesn't open the launch queue again.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    let active = true;
    const open = async (results: LaunchResult[]) => {
      if (!active) return;
      for (const result of results) {
        if (!result.ok) {
          toast.error(failureMessage(result, tRef.current), {
            description: tRef.current("share.import.nothingChanged"),
            duration: 10000,
          });
        }
      }
      const good = results.filter((result): result is Extract<LaunchResult, { ok: true }> => result.ok);
      if (good.length) setReady(good);
    };

    // Browsers without file handlers have no launch queue, so nothing is registered there.
    consumeLaunchQueue(window, (handles: readonly LaunchHandle[]) => void readLaunchFiles(handles).then(open));

    const params = new URLSearchParams(window.location.search);
    if (params.has(SHARE_PARAM) && "caches" in window) {
      params.delete(SHARE_PARAM);
      const query = params.toString();
      window.history.replaceState(window.history.state, "", window.location.pathname + (query ? `?${query}` : ""));
      void takeSharedFile(window.caches)
        .then((file) => (file ? readLaunchFiles([{ name: file.name, getFile: async () => file }]) : []))
        .then(open)
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, []);

  function close() {
    setReady([]);
  }

  async function confirm() {
    setBusy(true);
    try {
      let count = 0;
      for (const result of ready) count += await importProjects(result.text);
      toast.success(count === 1 ? t("launch.done.one", { name: summary.first }) : plural("launch.done", count), {
        description: t("launch.doneDescription"),
      });
      close();
    } catch {
      toast.error(t("launch.failed"), { description: t("share.import.nothingChanged") });
    } finally {
      setBusy(false);
    }
  }

  const summary = launchSummary(ready);
  return (
    <Dialog open={ready.length > 0} onOpenChange={(open) => !open && !busy && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {summary.count === 1
              ? t("launch.title.one", { name: summary.first || t("share.import.fallbackName") })
              : plural("launch.title", summary.count)}
          </DialogTitle>
          <DialogDescription>{t("launch.description")}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {ready.map((result) => (
            <li key={result.name} className="truncate">
              {t("launch.file", { file: result.name })}
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void confirm()} disabled={busy}>
            {t("launch.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
