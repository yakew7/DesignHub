import type { Metadata } from "next";

import { ModeSwitch } from "@/components/layout/mode-switch";
import { Workspace } from "@/components/layout/workspace";
import { SocialWorkspace } from "@/components/social/social-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("social");

export const metadata: Metadata = { title: "Social Media Studio", description: studio.description };

export default function SocialPage() {
  return (
    <Workspace className="gap-6">
      <PageHeader eyebrow="Studio" title={studio.title} description={studio.description} actions={<ModeSwitch />} />
      <SocialWorkspace />
    </Workspace>
  );
}
