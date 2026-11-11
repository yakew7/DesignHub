"use client";

import { useCallback, useState } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";

/** Copies text to the clipboard with a toast. `copied` flips back after 1.5s. */
export function useCopy() {
  const { t } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string, label?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(text);
        toast.success(label ?? t("copy.done"));
        window.setTimeout(() => setCopied((current) => (current === text ? null : current)), 1500);
      } catch {
        toast.error(t("copy.unavailable"), { description: t("copy.blocked") });
      }
    },
    [t],
  );

  return { copy, copied };
}
