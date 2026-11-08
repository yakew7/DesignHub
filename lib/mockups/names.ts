import { translateName } from "@/lib/i18n/dynamic-key";
import type { Translate } from "@/lib/i18n/translate";
import type { MockupCategory } from "@/lib/mockups/types";

/** The name of a template in the chosen language. Its id is what saved projects keep, so it never changes. */
export function mockupName(t: Translate, template: { id: string; label: string }): string {
  return translateName(t, `mockups.template.${template.id}`, template.label);
}

/** The name of a category in the chosen language. */
export function mockupCategoryName(t: Translate, category: MockupCategory): string {
  return translateName(t, `mockups.category.${category.toLowerCase()}`, category);
}
