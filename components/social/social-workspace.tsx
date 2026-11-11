"use client";

import "@/lib/i18n/areas/social";

import { memo, useDeferredValue, useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { SvgPreviewCanvas } from "@/components/canvas/svg-preview-canvas";
import { StudioLayout } from "@/components/layout/studio-layout";
import { SocialContentPanel } from "@/components/social/social-content-panel";
import { SocialExportPanel } from "@/components/social/social-export-panel";
import { SocialPicker } from "@/components/social/social-picker";
import { Panel } from "@/components/ui/panel";
import { useLoadedTemplate } from "@/hooks/use-loaded-template";
import { useSocialContext } from "@/hooks/use-social-context";
import { socialTemplateName } from "@/lib/social/names";
import { withSafeArea } from "@/lib/social/overlay";
import { getSocialTemplate, loadSocialTemplate, socialTemplates } from "@/lib/social/registry";
import { useSocialStore } from "@/store/social-store";

/** The picker takes no props, so it stays out of the redraws that follow every keystroke. */
const Templates = memo(SocialPicker);

/** Templates on the left; preview, then content, then export on the right. */
export function SocialWorkspace() {
  const { t } = useI18n();
  const ctx = useSocialContext();
  const templateId = useSocialStore((state) => state.template);
  const safeArea = useSocialStore((state) => state.safeArea);
  const wanted = getSocialTemplate(templateId) ?? socialTemplates[0];
  // The drawing code loads when a template is chosen; the last drawing stays until it arrives.
  const template = useLoadedTemplate(wanted?.id, loadSocialTemplate);
  // The inputs answer at once; the preview redraws a frame behind them and skips the keystrokes in between.
  const drawn = useDeferredValue(ctx);
  const svg = useMemo(() => (template ? template.render(drawn) : ""), [template, drawn]);
  const preview = useMemo(() => (template && safeArea ? withSafeArea(svg, template) : svg), [svg, template, safeArea]);
  const label = template ? `${template.platform} ${socialTemplateName(t, template)}` : t("social.preview.fallback");

  return (
    <StudioLayout
      id="social-v2"
      controls={
        <Panel title={t("social.panel.template")}>
          <Templates />
        </Panel>
      }
      preview={
        <>
          <div className="flex h-64 shrink-0 flex-col sm:h-80 lg:h-[clamp(320px,52dvh,520px)]">
            {preview ? (
              <SvgPreviewCanvas svg={preview} label={label} defaultBackdrop="checker" minHeight={180} />
            ) : (
              <div
                className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
                aria-busy={Boolean(wanted)}
              >
                {wanted ? t("social.preview.loading") : t("social.preview.pick")}
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
