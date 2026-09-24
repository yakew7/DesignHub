"use client";

import { useMemo } from "react";

import { SvgPreviewCanvas } from "@/components/canvas/svg-preview-canvas";
import { StudioLayout } from "@/components/layout/studio-layout";
import { SocialContentPanel } from "@/components/social/social-content-panel";
import { SocialExportPanel } from "@/components/social/social-export-panel";
import { SocialPicker } from "@/components/social/social-picker";
import { Panel } from "@/components/ui/panel";
import { useSocialContext } from "@/hooks/use-social-context";
import { withSafeArea } from "@/lib/social/overlay";
import { getSocialTemplate, socialTemplates } from "@/lib/social/registry";
import { useSocialStore } from "@/store/social-store";

/** Templates on the left; preview, then content, then export on the right. */
export function SocialWorkspace() {
  const ctx = useSocialContext();
  const templateId = useSocialStore((state) => state.template);
  const safeArea = useSocialStore((state) => state.safeArea);
  const template = getSocialTemplate(templateId) ?? socialTemplates[0];
  const svg = useMemo(() => (template ? template.render(ctx) : ""), [template, ctx]);
  const preview = useMemo(() => (template && safeArea ? withSafeArea(svg, template) : svg), [svg, template, safeArea]);
  const label = template ? `${template.platform} ${template.label}` : "Social asset";

  return (
    <StudioLayout
      id="social-v2"
      controls={
        <Panel title="Template">
          <SocialPicker />
        </Panel>
      }
      preview={
        <>
          <div className="flex h-64 shrink-0 flex-col sm:h-80 lg:h-[clamp(320px,52dvh,520px)]">
            {preview ? (
              <SvgPreviewCanvas svg={preview} label={label} defaultBackdrop="checker" minHeight={180} />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Pick a template.
              </div>
            )}
          </div>
          <SocialContentPanel ctx={ctx} />
          <SocialExportPanel svg={svg} ctx={ctx} template={template} />
        </>
      }
    />
  );
}
