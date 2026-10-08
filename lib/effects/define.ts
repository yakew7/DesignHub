import { defaultGradient } from "@/lib/color/gradient";
import type { EffectContext, EffectCss, EffectKind, EffectSettingsMap } from "@/types/effects";

/** Used where no studio state is at hand (tests, a fresh project): the Color Studio's default gradient. */
export const defaultEffectContext: EffectContext = { gradient: defaultGradient };

export type EffectDefinition<K extends EffectKind> = {
  kind: K;
  label: string;
  description: string;
  /**
   * `context` carries state from other studios (the Color Studio gradient) that some effects build
   * on. Without it, effects use `defaultEffectContext`.
   */
  generate: (settings: EffectSettingsMap[K], context?: EffectContext) => EffectCss;
};

export type AnyEffectDefinition = { [K in EffectKind]: EffectDefinition<K> }[EffectKind];

export function defineEffect<K extends EffectKind>(definition: EffectDefinition<K>): EffectDefinition<K> {
  return definition;
}
