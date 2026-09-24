"use client";

import { Moon, Sun } from "lucide-react";
import { useMemo } from "react";

import { SvgPreviewCanvas } from "@/components/canvas/svg-preview-canvas";
import { GuidelineExportPanel } from "@/components/guidelines/guideline-export-panel";
import { GuidelinePageList } from "@/components/guidelines/guideline-page-list";
import { GuidelineVoicePanel } from "@/components/guidelines/guideline-voice-panel";
import { StudioLayout } from "@/components/layout/studio-layout";
import { Panel } from "@/components/ui/panel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGuidelineContext } from "@/hooks/use-guideline-context";
import { getGuidelinePage, guidelinePages } from "@/lib/guidelines/registry";
import { coverStyles, type CoverStyle } from "@/lib/guidelines/types";
import { useGuidelinesStore } from "@/store/guidelines-store";
import type { BrandMode } from "@/types/brand";

export function GuidelinesWorkspace() {
  const { ctx, pages } = useGuidelineContext();
  const selected = useGuidelinesStore((state) => state.selected);
  const mode = useGuidelinesStore((state) => state.mode);
  const setMode = useGuidelinesStore((state) => state.setMode);
  const coverStyle = useGuidelinesStore((state) => state.coverStyle);
  const setCoverStyle = useGuidelinesStore((state) => state.setCoverStyle);
  const page = getGuidelinePage(selected) ?? guidelinePages[0];
  const number = ctx.contents.find((entry) => entry.id === page?.id)?.number ?? 0;
  const svg = useMemo(() => (page ? page.render(ctx, number) : ""), [page, ctx, number]);

  return (
    <StudioLayout
      id="guidelines"
      controls={
        <>
          <Panel title="Pages" description="Switch pages off to leave them out of the book.">
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(value) => value && setMode(value as BrandMode)}
              aria-label="Book theme"
              className="w-full"
            >
              <ToggleGroupItem value="light" className="flex-1">
                <Sun /> Light
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" className="flex-1">
                <Moon /> Dark
              </ToggleGroupItem>
            </ToggleGroup>
            <GuidelinePageList />
          </Panel>
          {page?.id === "cover" && (
            <Panel title="Cover style" description="The layout of the first page of the book.">
              <ToggleGroup
                type="single"
                value={coverStyle}
                onValueChange={(value) => value && setCoverStyle(value as CoverStyle)}
                aria-label="Cover style"
                className="w-full"
              >
                {coverStyles.map((item) => (
                  <ToggleGroupItem key={item.value} value={item.value} className="flex-1">
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Panel>
          )}
          <GuidelineVoicePanel />
        </>
      }
      preview={
        svg && page ? (
          <SvgPreviewCanvas svg={svg} label={`${page.title} page`} defaultBackdrop="checker" />
        ) : (
          <div className="flex min-h-80 flex-1 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Pick a page.
          </div>
        )
      }
      output={<GuidelineExportPanel ctx={ctx} pages={pages} page={page} svg={svg} />}
    />
  );
}
