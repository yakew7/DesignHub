"use client";

import { Shuffle } from "lucide-react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";

/** One click for a new palette, font pairing, radius and shadow, with undo. */
export function SurpriseButton() {
  const { t } = useI18n();

  async function surprise() {
    // Loaded on click: the generator and snapshots aren't needed to show the page.
    const [{ surpriseBrand }, { applySnapshot }, { checkpoint }] = await Promise.all([
      import("@/lib/brand/surprise"),
      import("@/lib/projects/snapshot"),
      import("@/lib/projects/versions"),
    ]);
    const before = surpriseBrand();
    void checkpoint("surprise", before);
    toast.success(t("brand.surprise.done"), {
      description: t("brand.surprise.doneDescription"),
      action: { label: t("common.undo"), onClick: () => applySnapshot(before) },
    });
  }

  return (
    <Button
      variant="outline"
      className="h-auto min-h-9 w-full whitespace-normal py-1.5"
      onClick={() => void surprise()}
    >
      <Shuffle /> {t("brand.surprise")}
    </Button>
  );
}
