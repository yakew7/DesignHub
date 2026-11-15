import type { Metadata } from "next";

import { Message } from "@/components/layout/message";
import { A11yWorkspace } from "@/components/accessibility/a11y-workspace";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { Workspace } from "@/components/layout/workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("accessibility");

export const metadata: Metadata = { title: "Accessibility Lab", description: studio.description };

export default function AccessibilityPage() {
  return (
    <Workspace className="gap-6">
      <PageHeader
        eyebrow="Studio"
        title={<Message id="studio.accessibility.title" />}
        description={studio.description}
        actions={<ModeSwitch />}
      />
      <A11yWorkspace />
    </Workspace>
  );
}
