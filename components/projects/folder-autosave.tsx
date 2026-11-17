"use client";

import "@/lib/i18n/areas/projects";

import { FolderSync } from "lucide-react";
import { useEffect } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import {
  allowFolderAccess,
  chooseFolder,
  disconnectFolder,
  initFolderSync,
  saveAllToFolder,
} from "@/lib/projects/folder-sync";
import { useFolderSyncStore } from "@/store/folder-sync-store";

/** Autosave to a local folder (File System Access API). Renders nothing where the browser cannot pick folders. */
export function FolderAutosave() {
  const { t, locale } = useI18n();
  const { supported, loaded, status, folderName, lastSavedAt, error } = useFolderSyncStore();

  useEffect(() => {
    void initFolderSync();
  }, []);

  if (!supported || !loaded) return null;

  const connected = status !== "off";
  const time = lastSavedAt ? new Intl.DateTimeFormat(locale, { timeStyle: "medium" }).format(lastSavedAt) : null;

  return (
    <section
      aria-labelledby="folder-autosave-title"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-surface-raised p-3 text-sm"
    >
      <FolderSync className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-48 flex-1">
        <h2 id="folder-autosave-title" className="font-medium">
          {t("projects.folder.title")}
        </h2>
        {connected ? (
          <p className="text-muted-foreground" data-testid="folder-status">
            <span className="font-medium text-foreground">
              {t("projects.folder.active", { name: folderName ?? "" })}
            </span>
            {" · "}
            {status === "saving"
              ? t("projects.folder.saving")
              : time
                ? t("projects.folder.savedAt", { time })
                : t("projects.folder.notSaved")}
          </p>
        ) : (
          <p className="text-muted-foreground">{t("projects.folder.hint")}</p>
        )}
        {status === "needs-permission" ? (
          <p role="status" className="text-warning">
            {t("projects.folder.needsPermission", { name: folderName ?? "" })}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-destructive">
            {t(`projects.folder.error.${error}`)}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!connected ? (
          <Button variant="outline" size="sm" onClick={() => void chooseFolder()}>
            {t("projects.folder.choose")}
          </Button>
        ) : (
          <>
            {status === "needs-permission" ? (
              <Button size="sm" onClick={() => void allowFolderAccess()}>
                {t("projects.folder.allow")}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => void saveAllToFolder()} disabled={status === "saving"}>
                {t("projects.folder.saveNow")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void chooseFolder()}>
              {t("projects.folder.change")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void disconnectFolder()}>
              {t("projects.folder.stop")}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
