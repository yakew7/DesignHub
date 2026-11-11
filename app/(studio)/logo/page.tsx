import type { Metadata } from "next";

import { Workspace } from "@/components/layout/workspace";
import { LogoWorkspace } from "@/components/logo/logo-workspace";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("logo");

export const metadata: Metadata = { title: "Logo Studio", description: studio.description };

export default function LogoPage() {
  return (
    <Workspace className="gap-6">
      <PageHeader eyebrow="Studio" title={studio.title} description={studio.description} actions={<ModeSwitch />} />
      <LogoWorkspace />
    </Workspace>
  );
}
