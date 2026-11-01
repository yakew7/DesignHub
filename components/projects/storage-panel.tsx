"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeDb } from "@/lib/db";
import type { ProjectVersion } from "@/lib/projects/history";
import { listAllVersions, removeVersions, restoreVersions } from "@/lib/projects/versions";
import { sizesByProject, trimDays, versionsToTrim } from "@/lib/projects/trim";
import { projectName } from "@/lib/projects/types";
import {
  clearOfflineCaches,
  measureOfflineCaches,
  measureRows,
  quotaShare,
  type CacheStore,
} from "@/lib/storage-report";
import { formatBytes } from "@/lib/svg-size";

type Report = {
  projects: { count: number; bytes: number };
  versions: { count: number; bytes: number };
  icons: { count: number; bytes: number };
  offline: { caches: number; files: number; bytes: number } | null;
  largest: ReturnType<typeof sizesByProject>;
  versionList: ProjectVersion[];
  usage?: number;
  quota?: number;
};

/** Sizes and counts of what DesignHub keeps on this device. Nothing is read out of a project, only measured. */
export function StoragePanel() {
  const { t, plural } = useI18n();
  const [days, setDays] = useState<number>(trimDays[1]);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    try {
      const [projects, versions, icons] = await Promise.all([
        safeDb((db) => db.projects.toArray(), []),
        safeDb((db) => db.versions.toArray(), []),
        safeDb((db) => db.icons.toArray(), []),
      ]);
      const versionList = await listAllVersions();
      const largest = sizesByProject(
        projects.map((project) => ({
          id: project.id,
          name: projectName(project),
          bytes: measureRows([project]).bytes,
        })),
        versions.map((row) => ({ projectId: row.projectId, bytes: measureRows([row]).bytes })),
      ).slice(0, 8);
      const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
      const offline = typeof caches === "undefined" ? null : await measureOfflineCaches(caches).catch(() => null);
      setReport({
        projects: measureRows(projects),
        versions: measureRows(versions),
        icons: measureRows(icons),
        offline,
        largest,
        versionList,
        usage: estimate?.usage,
        quota: estimate?.quota,
      });
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (typeof caches === "undefined") return;
    const store: CacheStore = { keys: () => caches.keys(), delete: (name) => caches.delete(name) };
    await clearOfflineCaches(store);
    toast.success(t("projects.storage.cleared"));
    await check();
  }

  const trimming = report ? versionsToTrim(report.versionList, days) : [];

  async function trim() {
    const removed = trimming;
    if (removed.length === 0) return;
    await removeVersions(removed);
    toast.success(plural("projects.storage.trimmed", removed.length), {
      duration: 8000,
      action: {
        label: t("common.undo"),
        onClick: () =>
          void restoreVersions(removed)
            .then(check)
            .then(() => toast.success(plural("projects.storage.trimRestored", removed.length))),
      },
    });
    await check();
  }

  const share = report ? quotaShare(report.usage, report.quota) : null;
  const rows = report
    ? [
        [t("projects.storage.projects"), `${report.projects.count} · ${formatBytes(report.projects.bytes)}`],
        [t("projects.storage.versions"), `${report.versions.count} · ${formatBytes(report.versions.bytes)}`],
        [t("projects.storage.icons"), `${report.icons.count} · ${formatBytes(report.icons.bytes)}`],
        [
          t("projects.storage.offline"),
          report.offline && report.offline.files > 0
            ? `${report.offline.files} · ${formatBytes(report.offline.bytes)}`
            : t("projects.storage.noCache"),
        ],
      ]
    : [];

  return (
    <Panel
      id="projects-storage"
      collapsible
      defaultOpen={false}
      title={t("projects.storage.title")}
      description={t("projects.storage.description")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => void check()} disabled={busy}>
          {t("projects.storage.check")}
        </Button>
        {report?.offline && report.offline.files > 0 ? (
          <Button variant="outline" size="sm" onClick={() => void clear()}>
            {t("projects.storage.clear")}
          </Button>
        ) : null}
      </div>
      {report ? (
        <div className="flex flex-col gap-2" role="status">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-mono text-xs">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            {share === null
              ? t("projects.storage.quotaUnknown")
              : t("projects.storage.quota", {
                  percent: share,
                  used: formatBytes(report.usage ?? 0),
                  quota: formatBytes(report.quota ?? 0),
                })}
          </p>
          {report.offline && report.offline.files > 0 ? (
            <p className="text-xs text-muted-foreground">{t("projects.storage.clearHint")}</p>
          ) : null}
          {report.largest.length > 0 ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-medium">{t("projects.storage.largest")}</h3>
              <ul className="flex flex-col gap-0.5 text-xs">
                {report.largest.map((row) => (
                  <li key={row.id} className="flex justify-between gap-3">
                    <span className="truncate">{row.name}</span>
                    <span className="shrink-0 font-mono text-muted-foreground">
                      {formatBytes(row.project)} + {formatBytes(row.history)} {t("projects.storage.history")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 border-t pt-2">
            <span className="text-xs">{t("projects.storage.trimLabel")}</span>
            <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
              <SelectTrigger size="sm" className="w-auto" aria-label={t("projects.storage.trimLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trimDays.map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {t("projects.storage.trimDays", { days: item })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => void trim()} disabled={trimming.length === 0}>
              {trimming.length === 0
                ? t("projects.storage.trimNone")
                : plural("projects.storage.trimButton", trimming.length)}
            </Button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
