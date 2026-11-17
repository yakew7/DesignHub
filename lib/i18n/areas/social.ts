import { registerAreaLoaders } from "@/lib/i18n/area-parts";
import { enSocial } from "@/lib/i18n/messages/en-social";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the social English messages available, and asks for the area's other languages. Every file
// that uses a `social.` key imports it, so the messages are in the chunks of the routes that use them and in no other
// route's first load.
registerEnglish(enSocial);
registerAreaLoaders("social", {
  es: () => import("@/lib/i18n/messages/es-social").then((module) => module.esSocial),
  fr: () => import("@/lib/i18n/messages/fr-social").then((module) => module.frSocial),
  hi: () => import("@/lib/i18n/messages/hi-social").then((module) => module.hiSocial),
});
