"use client";

import { Download, Plus, Trash2, Upload } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { downloadText } from "@/lib/download";
import { errorMessage } from "@/lib/i18n/errors";
import { svgToDataUrl } from "@/lib/icons/svg";
import { readSvgFile } from "@/lib/svg/read-file";
import { buildSprite, commitSymbolId, symbolIdClashes, type SpriteItem } from "@/lib/svg/sprite";
import { useSvgStore } from "@/store/svg-store";

const MAX_ITEMS = 100;

/**
 * Typing stays free; the id is slugged and de-duplicated only when the field commits (blur or
 * Enter), so "star" never jumps to "star-2" mid-word. A hint shows while the name clashes.
 */
function SymbolIdInput({
  sprite,
  index,
  onCommit,
}: {
  sprite: SpriteItem[];
  index: number;
  onCommit: (value: string) => void;
}) {
  const { t } = useI18n();
  const id = sprite[index]?.id ?? "";
  const [draft, setDraft] = useState<string | null>(null);
  const hintId = useId();
  const value = draft ?? id;
  // The message holds the id where {id} stands; the id is shown as code, so the text is split around it.
  const [before = "", after = ""] = t("svg.sprite.clash", { id: "\n" }).split("\n");
  const clash = draft !== null && symbolIdClashes(sprite, index, draft);

  function commit() {
    if (draft !== null) onCommit(draft);
    setDraft(null);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <Input
        value={value}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") setDraft(null);
        }}
        aria-label={t("svg.sprite.symbolId", { number: index + 1 })}
        aria-invalid={clash || undefined}
        aria-describedby={clash ? hintId : undefined}
        className="h-8 min-w-0 font-mono text-xs"
      />
      {clash ? (
        <p id={hintId} role="status" className="text-xs text-muted-foreground">
          {before}
          <code className="font-mono">{commitSymbolId(sprite, index, value)}</code>
          {after}
        </p>
      ) : null}
    </div>
  );
}

export function SpritePanel() {
  const { t, plural } = useI18n();
  const sprite = useSvgStore((state) => state.sprite);
  const name = useSvgStore((state) => state.name);
  const source = useSvgStore((state) => state.source);
  const addToSprite = useSvgStore((state) => state.addToSprite);
  const renameSprite = useSvgStore((state) => state.renameSprite);
  const removeFromSprite = useSvgStore((state) => state.removeFromSprite);
  const clearSprite = useSvgStore((state) => state.clearSprite);
  const inputRef = useRef<HTMLInputElement>(null);
  const spriteSvg = useMemo(() => (sprite.length ? buildSprite(sprite) : ""), [sprite]);

  async function upload(files: FileList | null) {
    if (!files) return;
    let added = 0;
    for (const file of Array.from(files).slice(0, MAX_ITEMS - sprite.length)) {
      try {
        addToSprite(file.name, await readSvgFile(file));
        added += 1;
      } catch (error) {
        toast.error(
          t("svg.sprite.failed", { name: file.name, message: errorMessage(error, t, "svg.sprite.unreadable") }),
        );
      }
    }
    if (added) toast.success(plural("svg.sprite.added", added));
  }

  return (
    <Panel title={t("svg.tab.sprite")} description={t("svg.sprite.description")}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addToSprite(name, source)}
          disabled={sprite.length >= MAX_ITEMS}
        >
          <Plus /> {t("svg.sprite.addCurrent")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={sprite.length >= MAX_ITEMS}
        >
          <Upload /> {t("svg.sprite.addFiles")}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".svg,image/svg+xml"
        className="sr-only"
        tabIndex={-1}
        aria-label={t("svg.sprite.filesLabel")}
        onChange={(event) => {
          void upload(event.target.files);
          event.target.value = "";
        }}
      />
      {sprite.length ? (
        <>
          <ul className="flex flex-col gap-1.5" aria-label={t("svg.sprite.symbols")}>
            {sprite.map((item, index) => (
              // Keyed by position so committing a new id with Enter keeps focus in the field.
              <li key={index} className="flex items-start gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG data URL preview */}
                <img
                  src={svgToDataUrl(item.source)}
                  alt=""
                  className="bg-checker size-8 shrink-0 rounded-md border object-contain p-1"
                />
                <SymbolIdInput sprite={sprite} index={index} onCommit={(value) => renameSprite(index, value)} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t("svg.sprite.remove", { id: item.id })}
                  onClick={() => removeFromSprite(index)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => downloadText(spriteSvg, "sprite.svg")}>
              <Download /> sprite.svg
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSprite}>
              {t("svg.sprite.clear")}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{t("svg.sprite.empty")}</p>
      )}
    </Panel>
  );
}
