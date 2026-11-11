import { keySlug, translateName } from "@/lib/i18n/dynamic-key";
import type { Translate } from "@/lib/i18n/translate";
import type { SocialTemplateInfo } from "@/lib/social/types";

type Named = Pick<SocialTemplateInfo, "label" | "group" | "style">;

const styleName = (t: Translate, style: string) => translateName(t, `social.style.${keySlug(style)}`, style);

/** The name of a style or an asset ("Aurora", "Story") in the chosen language: what the pack list and a style row show. */
export function socialShortName(t: Translate, template: Named): string {
  if (template.style) return styleName(t, template.style);
  // A few asset names are also style names (Minimal), which share one message.
  const own = translateName(t, `social.label.${keySlug(template.label)}`, "");
  return own || styleName(t, template.label);
}

/** The name of a style group ("Repository banner") in the chosen language. */
export function socialGroupName(t: Translate, group: string): string {
  return translateName(t, `social.group.${keySlug(group)}`, group);
}

/** The full name of a template in the chosen language. Its id is what saved projects keep, so it never changes. */
export function socialTemplateName(t: Translate, template: Named): string {
  if (template.group && template.style)
    return t("social.groupedName", {
      group: socialGroupName(t, template.group),
      style: socialShortName(t, template),
    });
  return socialShortName(t, template);
}

/** The description of a template in the chosen language (its tooltip). A template with no message keeps its English text. */
export function socialTemplateDescription(
  t: Translate,
  template: Pick<SocialTemplateInfo, "id" | "description">,
): string {
  return translateName(t, `social.description.${template.id}`, template.description);
}
