import type { Metadata } from "next";

import { Message } from "@/components/layout/message";
import { IconWorkspace } from "@/components/icons/icon-workspace";
import { Workspace } from "@/components/layout/workspace";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("icons");

export const metadata: Metadata = { title: "Icon Studio", description: studio.description };

export default function IconsPage() {
  return (
    <Workspace>
      <PageHeader
        eyebrow="Studio"
        title={<Message id="studio.icons.title" />}
        description={studio.description}
        actions={<ModeSwitch />}
      />
      <IconWorkspace />
    </Workspace>
  );
}
