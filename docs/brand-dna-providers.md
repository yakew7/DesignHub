# Adding a Brand DNA provider

Brand DNA providers turn an uploaded image into editable brand suggestions. The app has an on-device provider and a mock provider for developing the UI. Both implement the same interface, so a new provider can be registered without changing the editor.

## Provider contract

`BrandDnaProvider` is defined in `lib/brand-dna/types.ts`:

| Field         | Meaning                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| `id`          | Stable identifier stored by the Brand DNA provider selector.                              |
| `label`       | Name shown in the selector.                                                               |
| `description` | Short explanation shown below the name.                                                   |
| `local`       | Set to `true` when analysis stays on the device. The UI then shows a Private badge.       |
| `mocked`      | Set to `true` when the result is sample data. The UI then shows a Sample data badge.      |
| `analyze`     | Accepts one to five `DnaImage`s and optional `DnaOptions`, returns a `Promise<BrandDna>`. |

The images form one moodboard and get one combined result. Each `DnaImage` contains an id, the file name, preview URL, original dimensions, downscaled RGBA pixels and its own `ignoreBackground` choice; weigh images by their original area (`width * height`), as `extractCombinedPalette` in `lib/brand-dna/palette.ts` does. `DnaOptions` can include an `AbortSignal` and an `onStage` callback. Report the `reading`, `palette`, `mood`, and `type` stages as work advances, then report `done`. Pass the signal to cancellable work and stop when it is aborted.

A `BrandDna` result contains:

| Field             | Type         | Meaning                                                                                         |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `colors`          | `DnaColor[]` | Suggested colors with HEX value, relative weight and `primary`, `secondary`, or `neutral` role. |
| `heading`, `body` | `string`     | Suggested font family names.                                                                    |
| `personality`     | `string[]`   | Short personality descriptors.                                                                  |
| `mood`            | `string`     | A concise mood label.                                                                           |
| `radius`          | `number`     | Suggested corner radius in pixels.                                                              |
| `confidence`      | `number`     | Confidence from 0 to 1. The UI displays it but does not use it for logic.                       |
| `notes`           | `string[]`   | Explanations and limitations shown with the result.                                             |

## Minimal provider

This example always returns a grayscale palette. It demonstrates the required fields and progress callback without making a network request.

```ts
import type { BrandDna, BrandDnaProvider } from "@/lib/brand-dna/types";

export const grayscaleProvider: BrandDnaProvider = {
  id: "grayscale",
  label: "Grayscale example",
  description: "Returns a fixed grayscale palette.",
  local: true,
  mocked: false,
  async analyze(_images, options = {}) {
    const { signal, onStage } = options;
    signal?.throwIfAborted();

    onStage?.("reading");
    onStage?.("palette");
    onStage?.("mood");
    onStage?.("type");

    const result: BrandDna = {
      colors: [
        { hex: "#111827", weight: 0.5, role: "primary" },
        { hex: "#6B7280", weight: 0.3, role: "secondary" },
        { hex: "#F3F4F6", weight: 0.2, role: "neutral" },
      ],
      heading: "Inter",
      body: "Inter",
      personality: ["Clear", "Quiet"],
      mood: "Grayscale",
      radius: 8,
      confidence: 1,
      notes: ["Example output only. No image analysis is performed."],
    };

    onStage?.("done");
    return result;
  },
};
```

## Register a provider

1. Add the implementation under `lib/brand-dna/providers/`.
2. Import it in `lib/brand-dna/registry.ts` and add it to `dnaProviders`.
3. Keep `local` and `mocked` accurate so the selector badges describe the provider honestly.
4. Return a complete `BrandDna`; the editor lets people review and edit every field before applying it.
5. Run the checks listed in `CONTRIBUTING.md`.

The existing `localProvider` shows on-device palette extraction. `mockAiProvider` returns sample data for the UI. `lib/brand-dna/apply.ts` maps an accepted result into the existing brand stores.

## Privacy and configuration

- Keep on-device processing as the default.
- Do not commit API keys or put secrets in browser code. If a provider needs credentials or a server-side service, agree on that architecture before adding it.
- If the change introduces an environment variable, document it in `.env.example`.
