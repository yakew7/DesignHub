import type { INode } from "svgson";

import type { Localized } from "@/lib/i18n/errors";

export type SvgNode = INode;

export type SvgParseResult = { ok: true; root: SvgNode } | { ok: false; error: string; problem: Localized };
