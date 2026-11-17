import { registerAreaLoaders } from "@/lib/i18n/area-parts";
import { enIcons } from "@/lib/i18n/messages/en-icons";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the icons English messages available, and asks for the area's other languages. Every file
// that uses a `icons.` key imports it, so the messages are in the chunks of the routes that use them and in no other
// route's first load.
registerEnglish(enIcons);
registerAreaLoaders("icons", {
  es: () => import("@/lib/i18n/messages/es-icons").then((module) => module.esIcons),
  fr: () => import("@/lib/i18n/messages/fr-icons").then((module) => module.frIcons),
  hi: () => import("@/lib/i18n/messages/hi-icons").then((module) => module.hiIcons),
});
