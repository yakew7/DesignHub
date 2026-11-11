import { enSvg } from "@/lib/i18n/messages/en-svg";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the svg studio's English messages available. Only that studio's code imports it, so
// the messages are in that studio's chunks and in no other route's first load.
registerEnglish(enSvg);
