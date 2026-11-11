import { en } from "@/lib/i18n/messages/en";
import { registerEnglish } from "@/lib/i18n/translate";

// In the app a studio imports the English area it shows (lib/i18n/areas/<area>.ts). Unit tests run code from every studio, so
// they start with all of English registered.
registerEnglish(en);
