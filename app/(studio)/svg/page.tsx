import type { Metadata } from "next";

import { Workspace } from "@/components/layout/workspace";
import { SvgWorkspace } from "@/components/svg/svg-workspace";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("svg");

export const metadata: Metadata = { title: "SVG Playground", description: studio.description };

export default function SvgPage() {
  return (
    <Workspace className="gap-6">
      <PageHeader eyebrow="Studio" title={studio.title} description={studio.description} actions={<ModeSwitch />} />
      <SvgWorkspace />
    </Workspace>
  );
}
