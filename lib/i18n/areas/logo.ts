import { registerAreaLoaders } from "@/lib/i18n/area-parts";
import { enLogo } from "@/lib/i18n/messages/en-logo";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the logo English messages available, and asks for the area's other languages. Every file
// that uses a `logo.` key imports it, so the messages are in the chunks of the routes that use them and in no other
// route's first load.
registerEnglish(enLogo);
registerAreaLoaders("logo", {
  es: () => import("@/lib/i18n/messages/es-logo").then((module) => module.esLogo),
  fr: () => import("@/lib/i18n/messages/fr-logo").then((module) => module.frLogo),
  hi: () => import("@/lib/i18n/messages/hi-logo").then((module) => module.hiLogo),
  de: () => import("@/lib/i18n/messages/de-logo").then((module) => module.deLogo),
});
