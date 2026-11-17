import { registerAreaLoaders } from "@/lib/i18n/area-parts";
import { enSvg } from "@/lib/i18n/messages/en-svg";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the svg English messages available, and asks for the area's other languages. Every file
// that uses a `svg.` key imports it, so the messages are in the chunks of the routes that use them and in no other
// route's first load.
registerEnglish(enSvg);
registerAreaLoaders("svg", {
  es: () => import("@/lib/i18n/messages/es-svg").then((module) => module.esSvg),
  fr: () => import("@/lib/i18n/messages/fr-svg").then((module) => module.frSvg),
  hi: () => import("@/lib/i18n/messages/hi-svg").then((module) => module.hiSvg),
});
