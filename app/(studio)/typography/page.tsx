import type { Metadata } from "next";

import { Message } from "@/components/layout/message";
import { Workspace } from "@/components/layout/workspace";
import { TypographyWorkspace } from "@/components/typography/typography-workspace";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("typography");

export const metadata: Metadata = { title: "Typography Studio", description: studio.description };

export default function TypographyPage() {
  return (
    <Workspace>
      <PageHeader
        eyebrow="Studio"
        title={<Message id="studio.typography.title" />}
        description={studio.description}
        actions={<ModeSwitch />}
      />
      <TypographyWorkspace />
    </Workspace>
  );
}
