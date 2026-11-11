"use client";

import "@/lib/i18n/areas/mockups";

import { memo, useDeferredValue, useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { SvgPreviewCanvas } from "@/components/canvas/svg-preview-canvas";
import { StudioLayout } from "@/components/layout/studio-layout";
import { MockupContentPanel } from "@/components/mockups/mockup-content-panel";
import { MockupExportPanel } from "@/components/mockups/mockup-export-panel";
import { MockupPicker } from "@/components/mockups/mockup-picker";
import { Panel } from "@/components/ui/panel";
import { useLoadedTemplate } from "@/hooks/use-loaded-template";
import { useMockupContext } from "@/hooks/use-mockup-context";
import { mockupName } from "@/lib/mockups/names";
import { getTemplate, loadMockupTemplate, mockupTemplates } from "@/lib/mockups/registry";
import { signatureHtml } from "@/lib/mockups/signature";
import { useMockupStore } from "@/store/mockup-store";

/** The picker takes no props, so it stays out of the redraws that follow every keystroke. */
const Template = memo(MockupPicker);

export function MockupWorkspace() {
  const { t } = useI18n();
  const ctx = useMockupContext();
  const templateId = useMockupStore((state) => state.template);
  const wanted = getTemplate(templateId) ?? mockupTemplates[0];
  // The drawing code loads when a template is chosen; the last drawing stays until it arrives.
  const template = useLoadedTemplate(wanted?.id, loadMockupTemplate);
  // The inputs answer at once; the preview redraws a frame behind them and skips the keystrokes in between.
  const drawn = useDeferredValue(ctx);
  const svg = useMemo(() => (template ? template.render(drawn) : ""), [template, drawn]);

  return (
    <StudioLayout
      id="mockups"
      controls={
        <>
          <Panel title={t("mockups.panel.template")}>
            <Template />
          </Panel>
          <MockupContentPanel />
        </>
      }
      preview={
        svg ? (
          <SvgPreviewCanvas
            svg={svg}
            label={t("mockups.preview.label", { name: template ? mockupName(t, template) : "" })}
            defaultBackdrop="checker"
          />
        ) : (
          <div
            className="flex min-h-80 flex-1 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
            aria-busy={Boolean(wanted)}
          >
            {wanted ? t("mockups.preview.loading") : t("mockups.preview.pick")}
          </div>
        )
      }
      output={
        <MockupExportPanel
          svg={svg}
          name={ctx.brand.name}
          label={template?.label ?? "mockup"}
          signature={template?.id === "email-signature" ? signatureHtml(ctx) : undefined}
        />
      }
    />
  );
}
