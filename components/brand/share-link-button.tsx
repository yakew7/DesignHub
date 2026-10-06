"use client";

import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Copies a link that carries the whole brand in its hash, so nothing is uploaded. */
export function ShareLinkButton() {
  async function share() {
    // Loaded on click: encoding a share link isn't needed to show the page.
    const [{ copyShareLink }, { captureSnapshot }] = await Promise.all([
      import("@/components/projects/copy-share-link"),
      import("@/lib/projects/snapshot"),
    ]);
    await copyShareLink(captureSnapshot());
  }

  return (
    <Button
      variant="outline"
      className="col-span-2 w-full"
      onClick={() => void share()}
      title="Copy a link that imports this brand as a new project"
    >
      <Link2 /> Copy share link
    </Button>
  );
}
