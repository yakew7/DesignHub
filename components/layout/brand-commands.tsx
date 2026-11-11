"use client";

import { FileArchive, FileText, FolderOpen, Plus, Redo2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useBrandHistory } from "@/hooks/use-brand-history";
import { useGuidelineBase } from "@/hooks/use-guideline-context";
import { useVariantContext } from "@/hooks/use-variant-context";
import { downloadBlob } from "@/lib/download";
import { slugify } from "@/lib/logo/pack";
import { openProject } from "@/lib/projects/actions";
import { listProjectItems } from "@/lib/projects/repository";
import { sortProjects } from "@/lib/projects/sort";
import { projectName, type ProjectListItem } from "@/lib/projects/types";
import { useGuidelinesStore } from "@/store/guidelines-store";
import { useLogoStore } from "@/store/logo-store";
import { useProjectStore } from "@/store/project-store";
import { useUiStore } from "@/store/ui-store";

/**
 * Brand actions for the command palette: new project, switch project, and the two big
 * downloads. Loaded only while the palette is open, and the PDF and ZIP builders load on use.
 */
export function BrandCommands({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { t } = useI18n();
  const activeId = useProjectStore((state) => state.activeId);
  const requestNewProject = useUiStore((state) => state.requestNewProject);
  const guidelineBase = useGuidelineBase();
  const excluded = useGuidelinesStore((state) => state.excluded);
  const variantCtx = useVariantContext();
  const clearSpace = useLogoStore((state) => state.clearSpace);
  const { canUndo, canRedo, undo, redo } = useBrandHistory();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);

  // Re-read on every open, so projects created in this session show up.
  useEffect(() => {
    let active = true;
    void listProjectItems().then((list) => active && setProjects(sortProjects(list, "opened")));
    return () => {
      active = false;
    };
  }, []);

  const base = slugify(guidelineBase.brand.name);

  async function download(kind: "book" | "logo") {
    const id = toast.loading(t(kind === "book" ? "command.buildingBook" : "command.buildingLogo"));
    try {
      if (kind === "book") {
        const { buildBrandBookFrom } = await import("@/lib/guidelines/book");
        const pdf = await buildBrandBookFrom(guidelineBase, excluded);
        downloadBlob(new Blob([pdf.slice().buffer], { type: "application/pdf" }), `${base}-brand-guidelines.pdf`);
      } else {
        const { buildLogoPack } = await import("@/lib/logo/pack");
        const zip = await buildLogoPack(variantCtx, clearSpace);
        downloadBlob(new Blob([zip.slice().buffer], { type: "application/zip" }), `${base}-logo-pack.zip`);
      }
      toast.success(t("command.downloadReady"), { id });
    } catch {
      toast.error(t("command.exportFailed"), { id });
    }
  }

  return (
    <CommandGroup heading={t("command.group.brand")}>
      <CommandItem
        value="undo brand change"
        disabled={!canUndo}
        onSelect={() => {
          onDone();
          undo();
        }}
      >
        <Undo2 />
        {t("command.undo")}
      </CommandItem>
      <CommandItem
        value="redo brand change"
        disabled={!canRedo}
        onSelect={() => {
          onDone();
          redo();
        }}
      >
        <Redo2 />
        {t("command.redo")}
      </CommandItem>
      <CommandItem
        value="new brand project create"
        onSelect={() => {
          onDone();
          requestNewProject();
          router.push("/projects");
        }}
      >
        <Plus />
        {t("command.newProject")}
      </CommandItem>
      {projects
        .filter((project) => project.id !== activeId)
        .map((project) => (
          <CommandItem
            key={project.id}
            value={`open project ${projectName(project)} switch`}
            onSelect={() => {
              onDone();
              void openProject(project.id).then(() =>
                toast.success(t("projects.toast.opened", { name: projectName(project) })),
              );
            }}
          >
            <FolderOpen />
            {t("command.openProject", { name: projectName(project) })}
          </CommandItem>
        ))}
      <CommandItem
        value="download brand book guidelines pdf"
        onSelect={() => {
          onDone();
          void download("book");
        }}
      >
        <FileText />
        {t("command.downloadBook")}
      </CommandItem>
      <CommandItem
        value="download logo pack zip svg png"
        onSelect={() => {
          onDone();
          void download("logo");
        }}
      >
        <FileArchive />
        {t("command.downloadLogo")}
      </CommandItem>
    </CommandGroup>
  );
}
