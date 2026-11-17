import { enBrand } from "@/lib/i18n/messages/en-brand";
import { registerEnglish } from "@/lib/i18n/translate";

// Importing this module makes the brand English messages available. Every file that uses a `brand.` key imports it, so
// the messages are in the chunks of the routes that use them and in no other route's first load.
registerEnglish(enBrand);
