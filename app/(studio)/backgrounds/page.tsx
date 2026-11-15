import type { Metadata } from "next";

import { Message } from "@/components/layout/message";
import { BackgroundWorkspace } from "@/components/backgrounds/background-workspace";
import { Workspace } from "@/components/layout/workspace";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("backgrounds");

export const metadata: Metadata = { title: "Background Studio", description: studio.description };

export default function BackgroundsPage() {
  return (
    <Workspace className="gap-6">
      <PageHeader
        eyebrow="Studio"
        title={<Message id="studio.backgrounds.title" />}
        description={studio.description}
        actions={<ModeSwitch />}
      />
      <BackgroundWorkspace />
    </Workspace>
  );
}
