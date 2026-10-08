"use client";

import { useI18n } from "@/components/layout/locale-provider";
import type { PlainMessageKey } from "@/lib/i18n/translate";

/** A translated message, for Server Components that can't call `useI18n()` themselves. */
export function Message({ id }: { id: PlainMessageKey }) {
  const { t } = useI18n();
  return t(id);
}
