"use client";

import { ArrowLeftRight, Bookmark, Lock, Shuffle, Unlock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";

import { useI18n } from "@/components/layout/locale-provider";
import { FontPicker } from "@/components/typography/font-picker";
import { PairCard } from "@/components/typography/pair-card";
import { PairPreview } from "@/components/typography/pair-preview";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { useGoogleFonts } from "@/hooks/use-google-font";
import { useHotkey } from "@/hooks/use-hotkeys";
import { curatedPairs, randomPair, suggestBodies, type FontPair } from "@/lib/typography/pairing";
import { useLibraryStore } from "@/store/library-store";
import { useTypographyStore } from "@/store/typography-store";
import type { FontFamily } from "@/types/typography";

type Side = "heading" | "body";

const SIDE_MESSAGES = {
  heading: {
    label: "typography.pair.side.heading",
    picker: "typography.pair.picker.heading",
    lock: "typography.pair.lock.heading",
    unlock: "typography.pair.unlock.heading",
  },
  body: {
    label: "typography.pair.side.body",
    picker: "typography.pair.picker.body",
    lock: "typography.pair.lock.body",
    unlock: "typography.pair.unlock.body",
  },
} as const satisfies Record<Side, { label: string; picker: string; lock: string; unlock: string }>;

export function PairingStudio({ fonts }: { fonts: FontFamily[] }) {
  const { t } = useI18n();
  const headingFont = useTypographyStore((state) => state.headingFont);
  const bodyFont = useTypographyStore((state) => state.bodyFont);
  const setPair = useTypographyStore((state) => state.setPair);
  const savedPairs = useLibraryStore((state) => state.savedPairs);
  const toggleSavedPair = useLibraryStore((state) => state.toggleSavedPair);
  const [locks, setLocks] = useState({ heading: false, body: false });

  const catalog = useMemo(() => new Map(fonts.map((font) => [font.family, font])), [fonts]);
  const heading = catalog.get(headingFont);
  const body = catalog.get(bodyFont);
  useGoogleFonts([heading, body]);

  const suggestions = useMemo(() => (heading ? suggestBodies(heading, fonts) : []), [heading, fonts]);
  const isSaved = savedPairs.some((pair) => pair.heading === headingFont && pair.body === bodyFont);

  function shuffle() {
    setPair(randomPair(fonts, { heading: headingFont, body: bodyFont }, locks));
  }
  useHotkey("space", shuffle, { enabled: fonts.length > 0 });

  function select(pair: FontPair) {
    setPair(pair);
  }

  function save() {
    toggleSavedPair({ heading: headingFont, body: bodyFont });
    toast.success(isSaved ? t("typography.pair.toast.removed") : t("typography.pair.toast.saved"), {
      description: t("typography.pair.names", { heading: headingFont, body: bodyFont }),
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PairPreview heading={heading} body={body} headingName={headingFont} bodyName={bodyFont} />
        <Panel title={t("typography.pair.panel")}>
          {(["heading", "body"] as const).map((side) => (
            <div key={side} className="flex flex-col gap-2">
              <Label>{t(SIDE_MESSAGES[side].label)}</Label>
              <div className="flex gap-1">
                <FontPicker
                  label={t(SIDE_MESSAGES[side].picker)}
                  value={side === "heading" ? headingFont : bodyFont}
                  fonts={fonts}
                  onChange={(family) => setPair({ [side]: family })}
                  className="min-w-0 flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-pressed={locks[side]}
                  aria-label={t(locks[side] ? SIDE_MESSAGES[side].unlock : SIDE_MESSAGES[side].lock)}
                  onClick={() => setLocks((current) => ({ ...current, [side]: !current[side] }))}
                >
                  {locks[side] ? <Lock className="text-brand" /> : <Unlock />}
                </Button>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setPair({ heading: bodyFont, body: headingFont })}>
              <ArrowLeftRight /> {t("typography.pair.swap")}
            </Button>
            <Button variant="outline" onClick={save} aria-pressed={isSaved}>
              <Bookmark className={isSaved ? "fill-current text-brand" : undefined} />{" "}
              {isSaved ? t("typography.pair.saved") : t("typography.pair.save")}
            </Button>
          </div>
          <Button onClick={shuffle} disabled={fonts.length === 0}>
            <Shuffle /> {t("typography.pair.random")}{" "}
            <Kbd className="ml-auto border-transparent bg-primary-foreground/15 text-primary-foreground">Space</Kbd>
          </Button>
          {suggestions.length ? (
            <div className="flex flex-col gap-2 border-t pt-4">
              <Label>{t("typography.pair.suggestions", { font: headingFont })}</Label>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((font) => (
                  <button
                    key={font.family}
                    type="button"
                    onClick={() => setPair({ body: font.family })}
                    className="h-7 rounded-full border px-3 text-xs text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground aria-pressed:border-brand/60 aria-pressed:text-foreground"
                    aria-pressed={font.family === bodyFont}
                  >
                    {font.family}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      {savedPairs.length ? (
        <PairGallery
          title={t("typography.pair.saved.title")}
          pairs={savedPairs}
          catalog={catalog}
          current={{ heading: headingFont, body: bodyFont }}
          onSelect={select}
        />
      ) : null}
      <PairGallery
        title={t("typography.pair.curated.title")}
        pairs={curatedPairs}
        catalog={catalog}
        current={{ heading: headingFont, body: bodyFont }}
        onSelect={select}
      />
    </div>
  );
}

type PairGalleryProps = {
  title: string;
  pairs: FontPair[];
  catalog: Map<string, FontFamily>;
  current: FontPair;
  onSelect: (pair: FontPair) => void;
};

function PairGallery({ title, pairs, catalog, current, onSelect }: PairGalleryProps) {
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <h2 className="text-lg font-medium">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pairs.map((pair) => (
          <li key={`${pair.heading}-${pair.body}`} className="flex">
            <PairCard
              pair={pair}
              catalog={catalog}
              active={pair.heading === current.heading && pair.body === current.body}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
