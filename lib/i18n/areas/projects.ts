import { enProjects } from "@/lib/i18n/messages/en-projects";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the projects English messages available. Every file that uses a `projects.` key imports it, so
// the messages are in the chunks of the routes that use them and in no other route's first load.
registerEnglish(enProjects);
