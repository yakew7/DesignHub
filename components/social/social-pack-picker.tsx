"use client";

import { ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { defaultPackTemplates } from "@/lib/social/pack";
import { socialShortName } from "@/lib/social/names";
import { orderedSocialPlatforms, socialPlatformGroups, socialTemplates } from "@/lib/social/registry";
import { cn } from "@/lib/utils";
import { useSocialStore } from "@/store/social-store";

/** Checkboxes for the templates that go into the ZIP pack, grouped by platform. */
export function SocialPackPicker() {
  const { t } = useI18n();
  const selection = useSocialStore((state) => state.packSelection);
  const setSelection = useSocialStore((state) => state.setPackSelection);
  const [open, setOpen] = useState(false);
  const defaults = new Set(defaultPackTemplates().map((template) => template.id));
  const chosen = new Set(selection ?? defaults);

  const toggle = (ids: string[], on: boolean) => {
    const next = new Set(chosen);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    // The core platforms alone are stored as "default", so core templates added later are included too.
    const same = next.size === defaults.size && [...next].every((id) => defaults.has(id));
    setSelection(same ? null : socialTemplates.map((t) => t.id).filter((id) => next.has(id)));
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border p-2.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="social-pack-list"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center justify-between gap-2 text-left text-xs font-medium"
      >
        <span>
          {t("social.pack.choose")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("social.pack.count", { chosen: chosen.size, total: socialTemplates.length })}
          </span>
        </span>
        <ChevronDown className={cn("size-3.5 transition-transform duration-150", !open && "-rotate-90")} aria-hidden />
      </button>
      {open ? (
        <div id="social-pack-list" className="flex flex-col gap-3">
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7" onClick={() => setSelection(null)}>
              {t("social.pack.core")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setSelection(socialTemplates.map((template) => template.id))}
            >
              {t("social.pack.all")}
            </Button>
            <Button variant="outline" size="sm" className="h-7" onClick={() => setSelection([])}>
              {t("social.pack.none")}
            </Button>
          </div>
          {orderedSocialPlatforms
            .filter((platform) => socialTemplates.some((template) => template.platform === platform))
            .map((platform, index, list) => {
              const firstOfMore =
                socialPlatformGroups[platform] === "more" &&
                (index === 0 || socialPlatformGroups[list[index - 1]!] === "core");
              const templates = socialTemplates.filter((template) => template.platform === platform);
              const ids = templates.map((template) => template.id);
              const all = ids.every((id) => chosen.has(id));
              return (
                <Fragment key={platform}>
                  {firstOfMore ? (
                    <p className="border-t pt-2 text-[11px] font-medium text-muted-foreground">
                      {t("social.pack.more")}
                    </p>
                  ) : null}
                  <fieldset className="flex flex-col gap-1">
                    <legend className="sr-only">{platform}</legend>
                    <label className="flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-subtle-foreground uppercase">
                      <input
                        type="checkbox"
                        checked={all}
                        onChange={(event) => toggle(ids, event.target.checked)}
                        className="size-3.5 accent-[var(--color-brand)]"
                      />
                      {platform}
                    </label>
                    <div className="grid gap-1 pl-5 sm:grid-cols-2">
                      {templates.map((template) => (
                        <label
                          key={template.id}
                          className="flex min-h-6 items-center gap-2 text-xs text-muted-foreground"
                        >
                          <input
                            type="checkbox"
                            checked={chosen.has(template.id)}
                            onChange={(event) => toggle([template.id], event.target.checked)}
                            className="size-3.5 shrink-0 accent-[var(--color-brand)]"
                          />
                          <span className="truncate">{socialShortName(t, template)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </Fragment>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}
