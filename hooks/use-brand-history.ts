"use client";

import { useCallback, useSyncExternalStore } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import {
  getHistoryAvailability,
  redoBrand,
  subscribeHistory,
  undoBrand,
  type HistoryAvailability,
} from "@/lib/brand/history-session";

const none: HistoryAvailability = { canUndo: false, canRedo: false };

/** Undo and redo for brand edits across every studio, with a short confirmation toast. */
export function useBrandHistory() {
  const { t } = useI18n();
  const { canUndo, canRedo } = useSyncExternalStore(subscribeHistory, getHistoryAvailability, () => none);

  const undo = useCallback(() => {
    if (undoBrand()) toast(t("history.undone"), { id: "brand-history", duration: 1500 });
  }, [t]);
  const redo = useCallback(() => {
    if (redoBrand()) toast(t("history.redone"), { id: "brand-history", duration: 1500 });
  }, [t]);

  return { canUndo, canRedo, undo, redo };
}
