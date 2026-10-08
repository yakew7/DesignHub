"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toHex } from "@/lib/color/color";
import { errorMessage } from "@/lib/i18n/errors";
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
  const { t, plural } = useI18n();
  const [shared, setShared] = useState<SharedBrand | null>(null);
  const [busy, setBusy] = useState(false);
  // Read through a ref so a language change doesn't check the link again.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

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
        toast.error(errorMessage(error, tRef.current, "share.import.broken"), {
          description: tRef.current("share.import.nothingChanged"),
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
      toast.success(t("share.import.done", { name: project.snapshot.brand.profile.name }), {
        description: t("share.import.doneDescription"),
      });
      close();
    } catch {
      toast.error(t("share.import.failed"), { description: t("share.import.nothingChanged") });
    } finally {
      setBusy(false);
    }
  }

  const name = shared?.snapshot.brand.profile.name.trim() || t("share.import.fallbackName");
  return (
    <Dialog open={shared !== null} onOpenChange={(open) => !open && !busy && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("share.import.title", { name })}</DialogTitle>
          <DialogDescription>{t("share.import.description")}</DialogDescription>
        </DialogHeader>
        {shared ? (
          <div className="flex flex-col gap-3">
            <div className="flex h-8 overflow-hidden rounded-md border" aria-hidden="true">
              {shared.snapshot.colors.swatches.map((swatch) => (
                <span key={swatch.id} className="flex-1" style={{ background: toHex(swatch.color) }} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {plural("share.import.summary", shared.snapshot.colors.swatches.length, {
                heading: shared.snapshot.typography.headingFont,
                body: shared.snapshot.typography.bodyFont,
              })}
              {shared.logoOmitted ? ` ${t("share.import.logoOmitted")}` : ""}
            </p>
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void confirm()} disabled={busy}>
            {t("share.import.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
