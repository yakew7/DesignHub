import { registerAreaLoaders } from "@/lib/i18n/area-parts";
import { enBrand } from "@/lib/i18n/messages/en-brand";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the brand English messages available, and asks for the area's other languages. Every file
// that uses a `brand.` key imports it, so the messages are in the chunks of the routes that use them and in no other
// route's first load.
registerEnglish(enBrand);
registerAreaLoaders("brand", {
  es: () => import("@/lib/i18n/messages/es-brand").then((module) => module.esBrand),
  fr: () => import("@/lib/i18n/messages/fr-brand").then((module) => module.frBrand),
  hi: () => import("@/lib/i18n/messages/hi-brand").then((module) => module.hiBrand),
});
