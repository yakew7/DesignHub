import { registerAreaLoaders } from "@/lib/i18n/area-parts";
import { enMockups } from "@/lib/i18n/messages/en-mockups";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the mockups English messages available, and asks for the area's other languages. Every file
// that uses a `mockups.` key imports it, so the messages are in the chunks of the routes that use them and in no other
// route's first load.
registerEnglish(enMockups);
registerAreaLoaders("mockups", {
  es: () => import("@/lib/i18n/messages/es-mockups").then((module) => module.esMockups),
  fr: () => import("@/lib/i18n/messages/fr-mockups").then((module) => module.frMockups),
  hi: () => import("@/lib/i18n/messages/hi-mockups").then((module) => module.hiMockups),
  de: () => import("@/lib/i18n/messages/de-mockups").then((module) => module.deMockups),
});
