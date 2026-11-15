import type { Metadata } from "next";

import { Message } from "@/components/layout/message";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { Workspace } from "@/components/layout/workspace";
import { MockupWorkspace } from "@/components/mockups/mockup-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("mockups");

export const metadata: Metadata = { title: "Mockup Studio", description: studio.description };

export default function MockupsPage() {
  return (
    <Workspace className="gap-6">
      <PageHeader
        eyebrow="Studio"
        title={<Message id="studio.mockups.title" />}
        description={studio.description}
        actions={<ModeSwitch />}
      />
      <MockupWorkspace />
    </Workspace>
  );
}
