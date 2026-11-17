import { enColors } from "@/lib/i18n/messages/en-colors";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the colors English messages available. Every file that uses a `colors.` key imports it, so
// the messages are in the chunks of the routes that use them and in no other route's first load.
registerEnglish(enColors);
