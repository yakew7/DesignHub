import { toast } from "sonner";

import type { BrandSnapshot } from "@/lib/projects/snapshot";

/** Puts a share link for the brand on the clipboard. The link opens Brand Studio and offers to import it. */
export async function copyShareLink(snapshot: BrandSnapshot): Promise<void> {
  try {
    const { createShareLink } = await import("@/lib/projects/share");
    const { url, logoOmitted } = await createShareLink(snapshot, `${window.location.origin}/brand`);
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied", {
      description: logoOmitted
        ? "The uploaded logo was left out to keep the link short. Export the project as JSON to share it with the logo."
        : "Anyone with the link can import this brand as a new project.",
    });
  } catch {
    toast.error("Could not copy the share link in this browser.");
  }
}
