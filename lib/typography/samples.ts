/** A ready-made specimen text that shows whether a font covers a language or script. */
export type SpecimenSample = {
  id: string;
  label: string;
  text: string;
};

export const specimenSamples: SpecimenSample[] = [
  { id: "english", label: "English", text: "The quick brown fox jumps over the lazy dog" },
  {
    id: "spanish",
    label: "Spanish",
    text: "El veloz murciélago hindú comía feliz cardillo y kiwi. ¿La cigüeña tocaba el saxofón? ¡Sí, señor!",
  },
  { id: "german", label: "German", text: "Falsches Üben von Xylophonmusik quält jeden größeren Zwerg" },
  {
    id: "vietnamese",
    label: "Vietnamese",
    text: "Tôi có thể ăn thủy tinh mà không hại gì. Đường phố Hà Nội về đêm thật đẹp.",
  },
  { id: "greek", label: "Greek", text: "Ξεσκεπάζω την ψυχοφθόρα βδελυγμία" },
  { id: "cyrillic", label: "Cyrillic", text: "Съешь же ещё этих мягких французских булок, да выпей чаю" },
  {
    id: "numbers",
    label: "Numbers and punctuation",
    text: "0123456789 ½ ¾ % ‰ $ € £ ¥ + − × ÷ = ≠ < > (a) [b] {c} “quote” ‘single’ « » … · • & @ # * ! ? ; : / -",
  },
];

/** The sample the text currently matches, or undefined once the user has edited it. */
export function matchSample(text: string): SpecimenSample | undefined {
  return specimenSamples.find((sample) => sample.text === text);
}

/** True when the text has characters outside basic Latin, which many fonts don't cover. */
export function needsExtendedGlyphs(text: string): boolean {
  return /[^\u0000-\u007f]/.test(text);
}
