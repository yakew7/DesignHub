import { registerAreaLoaders } from "@/lib/i18n/area-parts";
import { enColors } from "@/lib/i18n/messages/en-colors";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the colors English messages available, and asks for the area's other languages. Every file
// that uses a `colors.` key imports it, so the messages are in the chunks of the routes that use them and in no other
// route's first load.
registerEnglish(enColors);
registerAreaLoaders("colors", {
  es: () => import("@/lib/i18n/messages/es-colors").then((module) => module.esColors),
  fr: () => import("@/lib/i18n/messages/fr-colors").then((module) => module.frColors),
  hi: () => import("@/lib/i18n/messages/hi-colors").then((module) => module.hiColors),
});
