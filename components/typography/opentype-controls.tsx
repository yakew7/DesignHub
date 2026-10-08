"use client";

import { Panel } from "@/components/ui/panel";
import { Switch } from "@/components/ui/switch";
import { useFontMeta } from "@/hooks/use-font-catalog";
import { fontStack } from "@/lib/typography/css";
import { featureGroups } from "@/lib/typography/opentype-features";
import { useTypographyStore } from "@/store/typography-store";

export function OpenTypeControls() {
  const activeFont = useTypographyStore((state) => state.activeFont);
  const openType = useTypographyStore((state) => state.openType);
  const toggleFeature = useTypographyStore((state) => state.toggleFeature);
  const meta = useFontMeta(activeFont);

  return (
    <Panel
      title="OpenType features"
      description="Support varies per font. Samples render in the active font so you can see what it ships."
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {featureGroups.map((group) => (
          <fieldset key={group.title} className="flex min-w-0 flex-col gap-1">
            <legend className="pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-subtle-foreground">
              {group.title}
            </legend>
            {group.features.map((feature) => {
              const id = `ot-${feature.tag}`;
              return (
                <div key={feature.tag} className="flex h-9 items-center gap-3">
                  <Switch id={id} checked={openType[feature.tag]} onCheckedChange={() => toggleFeature(feature.tag)} />
                  <label htmlFor={id} className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      {feature.label}{" "}
                      <code className="font-mono text-[11px] text-subtle-foreground">{feature.tag}</code>
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-base text-muted-foreground"
                      style={{
                        fontFamily: fontStack(activeFont, meta?.category),
                        fontFeatureSettings: `"${feature.tag}" ${openType[feature.tag] ? 1 : 0}`,
                      }}
                    >
                      {feature.sample}
                    </span>
                  </label>
                </div>
              );
            })}
          </fieldset>
        ))}
      </div>
    </Panel>
  );
}
