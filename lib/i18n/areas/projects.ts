import { registerAreaLoaders } from "@/lib/i18n/area-parts";
import { enProjects } from "@/lib/i18n/messages/en-projects";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the projects English messages available, and asks for the area's other languages. Every file
// that uses a `projects.` key imports it, so the messages are in the chunks of the routes that use them and in no other
// route's first load.
registerEnglish(enProjects);
registerAreaLoaders("projects", {
  es: () => import("@/lib/i18n/messages/es-projects").then((module) => module.esProjects),
  fr: () => import("@/lib/i18n/messages/fr-projects").then((module) => module.frProjects),
  hi: () => import("@/lib/i18n/messages/hi-projects").then((module) => module.hiProjects),
  de: () => import("@/lib/i18n/messages/de-projects").then((module) => module.deProjects),
});
