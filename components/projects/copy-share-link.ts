import { toast } from "sonner";

import type { Translate } from "@/lib/i18n/translate";
import type { BrandSnapshot } from "@/lib/projects/snapshot";

/** Puts a share link for the brand on the clipboard. The link opens Brand Studio and offers to import it. */
export async function copyShareLink(snapshot: BrandSnapshot, t: Translate): Promise<void> {
  try {
    const { createShareLink } = await import("@/lib/projects/share");
    const { url, logoOmitted } = await createShareLink(snapshot, `${window.location.origin}/brand`);
    await navigator.clipboard.writeText(url);
    toast.success(t("share.copied"), {
      description: t(logoOmitted ? "share.copiedLogoOmitted" : "share.copiedDescription"),
    });
  } catch {
    toast.error(t("share.copyFailed"));
  }
}
