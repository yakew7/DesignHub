"use client";

import { Shuffle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** One click for a new palette, font pairing, radius and shadow, with undo. */
export function SurpriseButton() {
  async function surprise() {
    // Loaded on click: the generator and snapshots aren't needed to show the page.
    const [{ surpriseBrand }, { applySnapshot }, { checkpoint }] = await Promise.all([
      import("@/lib/brand/surprise"),
      import("@/lib/projects/snapshot"),
      import("@/lib/projects/versions"),
    ]);
    const before = surpriseBrand();
    void checkpoint("surprise", before);
    toast.success("New direction applied", {
      description: "Palette, fonts, radius and shadow changed. Locked colors stayed.",
      action: { label: "Undo", onClick: () => applySnapshot(before) },
    });
  }

  return (
    <Button variant="outline" className="w-full" onClick={() => void surprise()}>
      <Shuffle /> Surprise me
    </Button>
  );
}
