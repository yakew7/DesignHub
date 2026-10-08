import type { Metadata } from "next";

import { Message } from "@/components/layout/message";
import { Workspace } from "@/components/layout/workspace";
import { ProjectManager } from "@/components/projects/project-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("projects");

export const metadata: Metadata = { title: studio.title, description: studio.description };

export default function ProjectsPage() {
  return (
    <Workspace className="gap-6">
      <PageHeader
        eyebrow={<Message id="projects.eyebrow" />}
        title={<Message id="studio.projects.title" />}
        description={<Message id="studio.projects.description" />}
      />
      <ProjectManager />
    </Workspace>
  );
}
