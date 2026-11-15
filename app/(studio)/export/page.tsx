import type { Metadata } from "next";

import { Message } from "@/components/layout/message";
import { ExportEngine } from "@/components/export/export-engine";
import { Workspace } from "@/components/layout/workspace";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("export");

export const metadata: Metadata = { title: "Export Engine", description: studio.description };

export default function ExportPage() {
  return (
    <Workspace>
      <PageHeader
        eyebrow="Studio"
        title={<Message id="studio.export.title" />}
        description={studio.description}
        actions={<ModeSwitch />}
      />
      <ExportEngine />
    </Workspace>
  );
}
