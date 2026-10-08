"use client";

import { Link2 } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";

/** Copies a link that carries the whole brand in its hash, so nothing is uploaded. */
export function ShareLinkButton() {
  const { t } = useI18n();

  async function share() {
    // Loaded on click: encoding a share link isn't needed to show the page.
    const [{ copyShareLink }, { captureSnapshot }] = await Promise.all([
      import("@/components/projects/copy-share-link"),
      import("@/lib/projects/snapshot"),
    ]);
    await copyShareLink(captureSnapshot(), t);
  }

  return (
    <Button variant="outline" className="col-span-2 w-full" onClick={() => void share()} title={t("share.buttonHint")}>
      <Link2 /> {t("share.button")}
    </Button>
  );
}
