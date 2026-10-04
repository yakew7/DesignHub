"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toHex } from "@/lib/color/color";
import { importSharedProject } from "@/lib/projects/actions";
import { readShareToken, shareToken, type SharedBrand } from "@/lib/projects/share";

/** Drops the share token from the address bar, so a reload doesn't ask again. */
function clearHash() {
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
}

/**
 * Opens share links (`#share=...`): checks the brand, then asks before adding it as a new
 * project. A bad link changes nothing, and the open project is never overwritten.
 */
export function ShareLinkImport() {
  const [shared, setShared] = useState<SharedBrand | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const token = shareToken(window.location.hash);
      if (!token) return;
      try {
        const brand = await readShareToken(token);
        if (active) setShared(brand);
      } catch (error) {
        if (!active) return;
        clearHash();
        // Longer than usual: it shows as the page loads, before anyone is looking for it.
        toast.error(error instanceof Error ? error.message : "That share link doesn't work.", {
          description: "Nothing was changed.",
          duration: 10000,
        });
      }
    };
    void check();
    const onHash = () => void check();
    window.addEventListener("hashchange", onHash);
    return () => {
      active = false;
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  function close() {
    setShared(null);
    clearHash();
  }

  async function confirm() {
    if (!shared) return;
    setBusy(true);
    try {
      const project = await importSharedProject(shared.snapshot);
      toast.success(`Imported ${project.snapshot.brand.profile.name}`, {
        description: "Added as a new project and opened. Your other projects are unchanged.",
      });
      close();
    } catch {
      toast.error("Could not import that brand.", { description: "Nothing was changed." });
    } finally {
      setBusy(false);
    }
  }

  const name = shared?.snapshot.brand.profile.name.trim() || "this brand";
  return (
    <Dialog open={shared !== null} onOpenChange={(open) => !open && !busy && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import {name}?</DialogTitle>
          <DialogDescription>
            Someone shared a brand with you. It is added as a new project and opened. Your current project is saved
            first and stays as it is.
          </DialogDescription>
        </DialogHeader>
        {shared ? (
          <div className="flex flex-col gap-3">
            <div className="flex h-8 overflow-hidden rounded-md border" aria-hidden="true">
              {shared.snapshot.colors.swatches.map((swatch) => (
                <span key={swatch.id} className="flex-1" style={{ background: toHex(swatch.color) }} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {shared.snapshot.typography.headingFont} and {shared.snapshot.typography.bodyFont},{" "}
              {shared.snapshot.colors.swatches.length} colors.
              {shared.logoOmitted ? " The uploaded logo was left out of the link, so it uses a generated mark." : ""}
            </p>
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void confirm()} disabled={busy}>
            Import as new project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
