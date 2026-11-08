import { parseSync } from "svgson";

import { localized, type Localized } from "@/lib/i18n/errors";
import { en } from "@/lib/i18n/messages/en";
import { format } from "@/lib/i18n/translate";
import type { SvgParseResult } from "@/types/svg";

/** Strips the prolog (XML declaration, doctype, leading comments) that svgson doesn't need. */
function stripProlog(source: string): string {
  return source
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .trim();
}

/** The message stays English in `error` (for logs and tests); `problem` is what the UI shows in any language. */
function failure(problem: Localized): SvgParseResult {
  return { ok: false, error: format(en[problem.key], problem.params), problem };
}

export function parseSvg(source: string): SvgParseResult {
  const input = stripProlog(source);
  if (!input) return failure(localized("svg.error.empty"));
  try {
    const root = parseSync(input);
    if (root?.name !== "svg") return failure(localized("svg.error.root"));
    return { ok: true, root };
  } catch {
    return failure(localized("svg.error.markup"));
  }
}
