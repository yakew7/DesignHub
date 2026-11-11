import { enMockups } from "@/lib/i18n/messages/en-mockups";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the mockups studio's English messages available. Only that studio's code imports it, so
// the messages are in that studio's chunks and in no other route's first load.
registerEnglish(enMockups);
