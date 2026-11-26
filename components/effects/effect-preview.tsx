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
          aria-label={t("studio.pane.previewBackdrop")}
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
          <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-80">{t("studio.effects.title")}</p>
          {kind === "highlighter" ? (
            <p className="text-lg leading-relaxed">
              <span className="dh-effect-highlight">{t("effects.preview.highlighter")}</span>
            </p>
          ) : kind === "scrollbar" || kind === "scroll-shadow" ? (
            <div
              className="dh-effect-scroll h-48 overflow-auto px-3 py-1 text-sm"
              role="region"
              aria-label={t("effects.preview.scrollSample")}
              tabIndex={0}
            >
              {Array.from({ length: 12 }, (_, index) => (
                <p key={index} className="mb-3 opacity-80">
                  {t("effects.preview.scrollLine", { line: index + 1, total: 12 })}
                </p>
              ))}
            </div>
          ) : kind === "selection" ? (
            <>
              <h3 className="font-display text-2xl font-semibold">{t("effects.preview.selectTitle")}</h3>
              <p className="text-sm">{t("effects.preview.selectBody")}</p>
            </>
          ) : kind === "button-press" ? (
            <>
              <h3 className="font-display text-2xl font-semibold">{t("effects.preview.pressTitle")}</h3>
              <p className="text-sm opacity-80">{t("effects.preview.pressBody")}</p>
              <button type="button" className="dh-effect-button mt-2 w-fit cursor-pointer px-6 py-3 font-semibold">
                {t("effects.preview.pressButton")}
              </button>
            </>
          ) : kind === "link-underline" ? (
            <>
              <h3 className="font-display text-2xl font-semibold">{t("effects.preview.linkTitle")}</h3>
              <p className="text-sm">
                <a className="dh-effect-link" href="#link-underline">
                  {t("effects.preview.linkText")}
                </a>{" "}
                {t("effects.preview.linkAfter")}
              </p>
            </>
          ) : kind === "duotone" ? (
            <div className="grid w-full grid-cols-2 gap-3">
              <figure className="flex flex-col gap-2">
                <div
                  className="aspect-[4/3] w-full rounded-md bg-cover bg-center"
                  style={{ backgroundImage: `url("${EFFECT_PHOTO_DATA_URL}")` }}
                  role="img"
                  aria-label={t("effects.preview.originalPhoto")}
                />
                <figcaption className="text-center text-xs font-medium uppercase tracking-wide opacity-80">
                  {t("effects.preview.before")}
                </figcaption>
              </figure>
              <figure className="flex flex-col gap-2">
                <div
                  className="dh-effect-duotone aspect-[4/3] w-full rounded-md bg-cover bg-center"
                  style={{ backgroundImage: `url("${EFFECT_PHOTO_DATA_URL}")` }}
                  role="img"
                  aria-label={t("effects.preview.duotonePhoto")}
                />
                <figcaption className="text-center text-xs font-medium uppercase tracking-wide opacity-80">
                  {t("effects.preview.after")}
                </figcaption>
              </figure>
            </div>
          ) : kind === "card-tilt" ? (
            <>
              <h3 className="font-display text-2xl font-semibold">{t("effects.preview.tiltTitle")}</h3>
              <div className="dh-effect-tilt mt-2 flex aspect-[3/2] w-full flex-col justify-end p-4 text-white">
                <p className="font-display text-lg font-semibold">{t("effects.preview.tiltCard")}</p>
                <p className="text-sm opacity-90">{t("effects.preview.tiltGlare")}</p>
              </div>
            </>
          ) : kind === "scrim" ? (
            <div
              className="dh-effect-scrim flex aspect-[4/3] w-full flex-col justify-end rounded-md bg-cover bg-center p-4"
              style={{ backgroundImage: `url("${EFFECT_PHOTO_DATA_URL}")`, color: scrimText }}
            >
              <h3 className="font-display text-xl font-semibold">{t("effects.preview.scrimTitle")}</h3>
              <p className="text-sm">{t("effects.preview.scrimBody")}</p>
            </div>
          ) : (
            <>
              <h3 className="font-display text-2xl font-semibold">{t("effects.preview.defaultTitle")}</h3>
              <p className="text-sm opacity-80">{t("effects.preview.defaultBody")}</p>
            </>
          )}
        </article>
      </EffectBackdrop>
    </>
  );
}
