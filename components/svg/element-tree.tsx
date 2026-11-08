"use client";

import { useMemo, type KeyboardEvent } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { outline, type NodePath } from "@/lib/svg/tree";
import { cn } from "@/lib/utils";
import { useSvgStore } from "@/store/svg-store";
import type { SvgNode } from "@/types/svg";

const samePath = (a: NodePath | null, b: NodePath) =>
  a !== null && a.length === b.length && a.every((v, i) => v === b[i]);

/** Keyboard-navigable outline of every element (↑/↓ to move, Home/End to jump). */
export function ElementTree({ root }: { root: SvgNode }) {
  const { t } = useI18n();
  const items = useMemo(() => outline(root), [root]);
  const selected = useSvgStore((state) => state.selected);
  const select = useSvgStore((state) => state.select);
  const current = items.findIndex((item) => samePath(selected, item.path));

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const next =
      event.key === "ArrowDown"
        ? current + 1
        : event.key === "ArrowUp"
          ? current - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    const item = items[Math.max(0, Math.min(items.length - 1, next))];
    if (item) {
      select(item.path);
      document.getElementById(`svg-node-${item.path.join("-") || "root"}`)?.focus();
    }
  }

  return (
    <ul
      role="listbox"
      aria-label={t("svg.layers.elements")}
      onKeyDown={onKeyDown}
      className="flex max-h-72 flex-col overflow-y-auto rounded-md border bg-surface py-1 font-mono text-[11px] scrollbar-thin"
    >
      {items.map((item) => {
        const active = samePath(selected, item.path);
        return (
          <li key={item.path.join("-") || "root"} role="presentation">
            <button
              id={`svg-node-${item.path.join("-") || "root"}`}
              type="button"
              role="option"
              aria-selected={active}
              tabIndex={active || (current === -1 && item.path.length === 0) ? 0 : -1}
              onClick={() => select(item.path)}
              className={cn(
                "flex w-full items-center gap-1.5 py-1 pr-2 text-left text-muted-foreground hover:bg-accent hover:text-foreground",
                active && "bg-brand/15 text-foreground",
              )}
              style={{ paddingLeft: 8 + item.depth * 12 }}
            >
              <span className={cn(item.name === "g" || item.name === "svg" ? "text-brand" : "text-foreground")}>
                &lt;{item.name}&gt;
              </span>
              {item.id ? <span className="truncate text-subtle-foreground">#{item.id}</span> : null}
              {item.children ? <span className="ml-auto text-subtle-foreground">{item.children}</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
