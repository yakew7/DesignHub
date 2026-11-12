"use client";

import { useState } from "react";

import { useKeptStudios } from "@/hooks/use-kept-studios";
import { clearIconCache } from "@/lib/icons/iconify";
import { keepStudios } from "@/lib/offline-keep";
import { recentStudioHrefs } from "@/lib/offline-recent";
import { studios } from "@/lib/navigation";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/ui/section";
import { Switch } from "@/components/ui/switch";
import { useCommandRecentsStore } from "@/store/command-recents-store";
import { useNavStore } from "@/store/nav-store";
import { usePanelStore } from "@/store/panel-store";
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
  protectionOf,
  quotaNearlyFull,
  quotaShare,
  requestProtection,
  type Protection,
  type CacheStore,
} from "@/lib/storage-report";
import { formatBytes } from "@/lib/svg-size";

type Report = {
  projects: { count: number; bytes: number };
  versions: { count: number; bytes: number };
  icons: { count: number; bytes: number };
  offline: { caches: number; files: number; bytes: number; runtime: { files: number; bytes: number } } | null;
  largest: ReturnType<typeof sizesByProject>;
  protection: Protection;
  versionList: ProjectVersion[];
  usage?: number;
  quota?: number;
};

/** Sizes and counts of what DesignHub keeps on this device. Nothing is read out of a project, only measured. */
/** What the Storage panel holds. Loaded the first time the panel is opened, so the Projects route does not carry it. */
export function StorageBody() {
  const { t, plural } = useI18n();
  const { kept, refresh } = useKeptStudios();
  const [wanted, setWanted] = useState<Set<string>>(new Set());
  const [keeping, setKeeping] = useState<{ done: number; total: number } | null>(null);
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
        protection: await protectionOf(navigator.storage),
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

  async function protect() {
    const result = await requestProtection(navigator.storage);
    toast(t(result === "protected" ? "projects.storage.protectedNow" : "projects.storage.refused"));
    await check();
  }

  async function clearIcons() {
    await clearIconCache();
    toast.success(t("projects.storage.iconsCleared"));
    await check();
  }

  async function keep(paths: string[]) {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const before = typeof caches === "undefined" ? null : await measureOfflineCaches(caches).catch(() => null);
    setKeeping({ done: 0, total: paths.length });
    const result = await keepStudios(paths, navigator.serviceWorker, (done, total) => setKeeping({ done, total }));
    setKeeping(null);
    setWanted((current) => new Set([...current].filter((href) => !paths.includes(href))));
    const after = typeof caches === "undefined" ? null : await measureOfflineCaches(caches).catch(() => null);
    const added = before && after ? Math.max(0, after.bytes - before.bytes) : 0;
    toast(plural("projects.storage.keep.kept", result.kept.length, { size: formatBytes(added) }), {
      description: result.failed.length > 0 ? plural("projects.storage.keep.failed", result.failed.length) : undefined,
    });
    refresh();
    await check();
  }

  const keepRecent = useNavStore((state) => state.keepRecent);
  const setKeepRecent = useNavStore((state) => state.setKeepRecent);
  const lastStudio = useNavStore((state) => state.lastStudio);
  const recentCommands = useCommandRecentsStore((state) => state.recent);
  const recentStudios = keepRecent
    ? recentStudioHrefs(lastStudio, recentCommands).flatMap((href) => studios.filter((studio) => studio.href === href))
    : [];
  const setSectionOpen = usePanelStore((state) => state.setOpen);
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
    <>
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
        <div className="flex flex-col gap-3" role="status">
          <Section id="storage-overview" title={t("projects.storage.section.overview")} defaultOpen>
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
            {quotaNearlyFull(share) ? (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-warning/40 p-2">
                <p className="text-xs">{t("projects.storage.nearlyFull", { percent: share ?? 0 })}</p>
                <Button variant="outline" size="sm" onClick={() => setSectionOpen("storage-projects", true)}>
                  {t("projects.storage.showVersions")}
                </Button>
              </div>
            ) : null}
            {report.icons.count > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void clearIcons()}>
                  {t("projects.storage.clearIcons")}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t("projects.storage.iconsHint", {
                    count: report.icons.count,
                    size: formatBytes(report.icons.bytes),
                  })}
                </p>
              </div>
            ) : null}
          </Section>
          <Section id="storage-offline" title={t("projects.storage.section.offline")}>
            {report.offline && report.offline.files > 0 ? (
              <p className="text-xs text-muted-foreground">{t("projects.storage.clearHint")}</p>
            ) : null}
            {report.offline && report.offline.runtime.files > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("projects.storage.runtime", {
                  files: report.offline.runtime.files,
                  size: formatBytes(report.offline.runtime.bytes),
                  limit: formatBytes(50 * 1024 * 1024),
                })}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <Label htmlFor="keep-recent" className="text-xs">
                  {t("projects.storage.keepRecent")}
                </Label>
                <p className="text-xs text-muted-foreground">{t("projects.storage.keepRecentHint")}</p>
              </div>
              <Switch id="keep-recent" checked={keepRecent} onCheckedChange={setKeepRecent} />
            </div>
            {recentStudios.length > 0 ? (
              <div className="flex flex-col gap-1">
                <h4 id="storage-recent" className="text-xs font-medium">
                  {t("projects.storage.recent.title")}
                </h4>
                <ul aria-labelledby="storage-recent" className="flex flex-col gap-1 text-xs">
                  {recentStudios.map((studio) => {
                    const name = t(`studio.${studio.id}.short`);
                    return (
                      <li key={studio.id} className="flex min-h-7 items-center justify-between gap-2">
                        <span>{name}</span>
                        {kept.has(studio.href) ? (
                          <span className="text-muted-foreground">{t("nav.kept")}</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={keeping !== null}
                            aria-label={t("projects.storage.recent.keepNamed", { name })}
                            onClick={() => void keep([studio.href])}
                          >
                            {t("projects.storage.recent.keep")}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="pb-1 text-xs font-medium">{t("projects.storage.keep.title")}</legend>
              <p className="text-xs text-muted-foreground">{t("projects.storage.keep.hint")}</p>
              <ul className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                {studios.map((studio) => {
                  const isKept = kept.has(studio.href);
                  return (
                    <li key={studio.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`keep-${studio.id}`}
                        disabled={isKept || keeping !== null}
                        checked={isKept || wanted.has(studio.href)}
                        onChange={() =>
                          setWanted((current) => {
                            const next = new Set(current);
                            if (!next.delete(studio.href)) next.add(studio.href);
                            return next;
                          })
                        }
                      />
                      <label htmlFor={`keep-${studio.id}`}>
                        {t(`studio.${studio.id}.short`)}
                        {isKept ? <span className="text-muted-foreground"> · {t("nav.kept")}</span> : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                disabled={wanted.size === 0 || keeping !== null}
                onClick={() => void keep([...wanted])}
              >
                {keeping
                  ? t("projects.storage.keep.progress", { done: keeping.done, total: keeping.total })
                  : plural("projects.storage.keep.button", wanted.size)}
              </Button>
            </fieldset>
          </Section>
          <Section id="storage-projects" title={t("projects.storage.section.projects")}>
            {report.largest.length > 0 ? (
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-medium">{t("projects.storage.largest")}</h4>
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
          </Section>
          <Section id="storage-protection" title={t("projects.storage.section.protection")}>
            <p className="text-xs text-muted-foreground">{t(`projects.storage.protection.${report.protection}`)}</p>
            {report.protection === "not-protected" ? (
              <Button variant="outline" size="sm" className="self-start" onClick={() => void protect()}>
                {t("projects.storage.protect")}
              </Button>
            ) : null}
          </Section>
        </div>
      ) : null}
    </>
  );
}
