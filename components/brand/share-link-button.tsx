"use client";

import { Link2 } from "lucide-react";

import { copyShareLink } from "@/components/projects/copy-share-link";
import { Button } from "@/components/ui/button";
import { captureSnapshot } from "@/lib/projects/snapshot";

/** Copies a link that carries the whole brand in its hash, so nothing is uploaded. */
export function ShareLinkButton() {
  return (
    <Button
      variant="outline"
      className="col-span-2 w-full"
      onClick={() => void copyShareLink(captureSnapshot())}
      title="Copy a link that imports this brand as a new project"
    >
      <Link2 /> Copy share link
    </Button>
  );
}
