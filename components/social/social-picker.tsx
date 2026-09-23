"use client";

import { useHotkey } from "@/hooks/use-hotkeys";
import { socialPlatforms, socialTemplates } from "@/lib/social/registry";
import { cn } from "@/lib/utils";
import { useSocialStore } from "@/store/social-store";

export function SocialPicker() {
  const template = useSocialStore((state) => state.template);
  const setTemplate = useSocialStore((state) => state.setTemplate);
  const platforms = socialPlatforms.filter((platform) => socialTemplates.some((item) => item.platform === platform));
  // Cycle in the order the picker shows them (grouped by platform), wrapping at both ends.
  const ordered = platforms.flatMap((platform) => socialTemplates.filter((item) => item.platform === platform));
  const cycle = (step: number) => {
    if (ordered.length === 0) return;
    const index = ordered.findIndex((item) => item.id === template);
    const next = ordered[(Math.max(index, 0) + step + ordered.length) % ordered.length];
    if (next) setTemplate(next.id);
  };
  useHotkey("]", () => cycle(1));
  useHotkey("[", () => cycle(-1));

  if (platforms.length === 0) {
    return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No templates yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {platforms.map((platform) => (
        <div key={platform} role="radiogroup" aria-label={platform} className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-[0.12em] text-subtle-foreground uppercase">{platform}</span>
          <div className="flex flex-col gap-1.5">
            {socialTemplates
              .filter((item) => item.platform === platform)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={item.id === template}
                  title={item.description}
                  onClick={() => setTemplate(item.id)}
                  className={cn(
                    "flex h-9 min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground",
                    item.id === template && "border-brand/60 bg-surface-raised text-foreground",
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">
                    {item.width}×{item.height}
                  </span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
