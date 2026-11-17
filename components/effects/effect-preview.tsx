"use client";

import { useI18n } from "@/components/layout/locale-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EFFECT_PHOTO_DATA_URL, EffectBackdrop } from "@/components/effects/effect-backdrop";
import { parseColor } from "@/lib/color/color";
import { effectStylesheet } from "@/lib/effects/css";
import { useEffectsStore } from "@/store/effects-store";
import type { MessageKey } from "@/lib/i18n/translate";
import type { EffectBackdrop as Backdrop, EffectCss, EffectKind } from "@/types/effects";

function isDark(hex: string): boolean {
  const color = parseColor(hex);
  return color ? color.l < 0.6 : true;
}

const PREVIEW_SELECTOR = ".dh-effect-preview";

const PLAIN = new Set<Backdrop>(["light", "dark"]);

const backdrops = [
  { value: "gradient", label: "effects.field.gradient" },
  { value: "photo", label: "effects.backdrop.photo" },
  { value: "light", label: "effects.backdrop.light" },
  { value: "dark", label: "effects.backdrop.dark" },
] as const satisfies readonly { value: Backdrop; label: MessageKey }[];

export function EffectPreview({ effect, kind }: { effect: EffectCss | null; kind: EffectKind }) {
  const { t } = useI18n();
  const chosen = useEffectsStore((state) => state.backdrop);
  const scrimText = useEffectsStore((state) => state.settings.scrim.text);
  const setBackdrop = useEffectsStore((state) => state.setBackdrop);
  const surface = effect?.surface;
  const plain = Boolean(effect?.plainBackdrop);
  // A gradient fill disappears into a busy backdrop, so those effects fall back to the dark one.
  const backdrop = plain && !PLAIN.has(chosen) ? "dark" : chosen;
  const dark = surface ? isDark(surface) : backdrop !== "light";
  const cardFill = effect?.fill ?? (effect?.needsFill ? (dark ? "#18181b" : "#ffffff") : undefined);
  const cardDark = effect?.fill ? isDark(effect.fill) : dark;
  const selector =
    kind === "highlighter"
      ? `${PREVIEW_SELECTOR} .dh-effect-highlight`
      : kind === "scrollbar" || kind === "scroll-shadow"
        ? `${PREVIEW_SELECTOR} .dh-effect-scroll`
        : kind === "button-press"
          ? `${PREVIEW_SELECTOR} .dh-effect-button`
          : kind === "link-underline"
            ? `${PREVIEW_SELECTOR} .dh-effect-link`
            : kind === "duotone"
              ? `${PREVIEW_SELECTOR} .dh-effect-duotone`
              : kind === "scrim"
                ? `${PREVIEW_SELECTOR} .dh-effect-scrim`
                : kind === "card-tilt"
                  ? `${PREVIEW_SELECTOR} .dh-effect-tilt`
                  : PREVIEW_SELECTOR;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{t("studio.pane.preview")}</h2>
        <ToggleGroup
          type="single"
          value={backdrop}
          onValueChange={(value) => value && setBackdrop(value as Backdrop)}
          aria-label="Preview backdrop"
          disabled={Boolean(surface)}
        >
          {backdrops.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value} disabled={plain && !PLAIN.has(item.value)}>
              {t(item.label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {/* The stylesheet is generated from numeric controls and color pickers, never from free text. */}
      {effect ? <style>{effectStylesheet(effect, selector)}</style> : null}
      <EffectBackdrop backdrop={backdrop} surface={surface}>
        <article
          style={cardFill ? { backgroundColor: cardFill } : undefined}
          className={`dh-effect-preview flex w-full max-w-sm flex-col gap-3 p-8 ${cardDark ? "text-white" : "text-slate-800"}`}
        >
          <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-80">Effects Lab</p>
          {kind === "highlighter" ? (
            <p className="text-lg leading-relaxed">
              <span className="dh-effect-highlight">
                A marker-style highlight that follows text across multiple lines, with readable contrast.
              </span>
            </p>
          ) : kind === "scrollbar" || kind === "scroll-shadow" ? (
            <div
              className="dh-effect-scroll h-48 overflow-auto px-3 py-1 text-sm"
              role="region"
              aria-label="Scrollable sample"
              tabIndex={0}
            >
              {Array.from({ length: 12 }, (_, index) => (
                <p key={index} className="mb-3 opacity-80">
                  Scroll this box to see the thumb and track. Line {index + 1} of 12.
                </p>
              ))}
            </div>
          ) : kind === "selection" ? (
            <>
              <h3 className="font-display text-2xl font-semibold">Select any of this text.</h3>
              <p className="text-sm">Drag across a few words, or double click one, to see the selection color.</p>
            </>
          ) : kind === "button-press" ? (
            <>
              <h3 className="font-display text-2xl font-semibold">Hover it. Press it.</h3>
              <p className="text-sm opacity-80">The button lifts on hover and sinks while pressed.</p>
              <button type="button" className="dh-effect-button mt-2 w-fit cursor-pointer px-6 py-3 font-semibold">
                Press me
              </button>
            </>
          ) : kind === "link-underline" ? (
            <>
              <h3 className="font-display text-2xl font-semibold">A link you can hover.</h3>
              <p className="text-sm">
                <a className="dh-effect-link" href="#link-underline">
                  Hover this link
                </a>{" "}
                and the underline grows.
              </p>
            </>
          ) : kind === "duotone" ? (
            <div className="grid w-full grid-cols-2 gap-3">
              <figure className="flex flex-col gap-2">
                <div
                  className="aspect-[4/3] w-full rounded-md bg-cover bg-center"
                  style={{ backgroundImage: `url("${EFFECT_PHOTO_DATA_URL}")` }}
                  role="img"
                  aria-label="Original photo"
                />
                <figcaption className="text-center text-xs font-medium uppercase tracking-wide opacity-80">
                  Before
                </figcaption>
              </figure>
              <figure className="flex flex-col gap-2">
                <div
                  className="dh-effect-duotone aspect-[4/3] w-full rounded-md bg-cover bg-center"
                  style={{ backgroundImage: `url("${EFFECT_PHOTO_DATA_URL}")` }}
                  role="img"
                  aria-label="Duotone photo"
                />
                <figcaption className="text-center text-xs font-medium uppercase tracking-wide opacity-80">
                  After
                </figcaption>
              </figure>
            </div>
          ) : kind === "card-tilt" ? (
            <>
              <h3 className="font-display text-2xl font-semibold">Hover the card.</h3>
              <div className="dh-effect-tilt mt-2 flex aspect-[3/2] w-full flex-col justify-end p-4 text-white">
                <p className="font-display text-lg font-semibold">Tilts toward you</p>
                <p className="text-sm opacity-90">The glare follows the light.</p>
              </div>
            </>
          ) : kind === "scrim" ? (
            <div
              className="dh-effect-scrim flex aspect-[4/3] w-full flex-col justify-end rounded-md bg-cover bg-center p-4"
              style={{ backgroundImage: `url("${EFFECT_PHOTO_DATA_URL}")`, color: scrimText }}
            >
              <h3 className="font-display text-xl font-semibold">Text that stays readable.</h3>
              <p className="text-sm">A scrim darkens the photo behind it.</p>
            </div>
          ) : (
            <>
              <h3 className="font-display text-2xl font-semibold">Depth without the fuss.</h3>
              <p className="text-sm opacity-80">Tweak the controls; copy production-ready CSS or Tailwind utilities.</p>
            </>
          )}
        </article>
      </EffectBackdrop>
    </>
  );
}
