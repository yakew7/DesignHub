# Keyboard shortcuts

DesignHub is built to be driven from the keyboard. This is the full list, the same one the app shows when you press `?`. The list lives in `lib/shortcuts.ts` and the dialog in `components/layout/shortcuts-dialog.tsx`.

A few rules apply everywhere:

- `⌘` is `Ctrl` on Windows and Linux, and `⌥` is `Alt`.
- Shortcuts don't fire while you type in a text field, except `⌘K`, which always opens the command palette.
- `Space` keeps its normal job on a focused button, link or toggle, so it only runs the shortcut when nothing interactive has focus.
- `G` shortcuts are sequences: press `G`, let go, then press the second key within a second.
- Studio shortcuts only work on that studio's page.

## Global

| Keys    | Action                    |
| ------- | ------------------------- |
| `⌘` `K` | Open command palette      |
| `/`     | Open command palette      |
| `?`     | Show keyboard shortcuts   |
| `⌥` `T` | Toggle dark / light theme |
| `G` `H` | Go home                   |
| `G` `R` | Go to Brand Studio        |
| `G` `D` | Go to Brand DNA           |
| `G` `L` | Go to Logo Studio         |
| `G` `M` | Go to Mockup Studio       |
| `G` `O` | Go to Social Media Studio |
| `G` `U` | Go to Brand Guidelines    |
| `G` `P` | Go to Brand Projects      |
| `G` `T` | Go to Typography Studio   |
| `G` `C` | Go to Color Studio        |
| `G` `I` | Go to Icon Studio         |
| `G` `B` | Go to Background Studio   |
| `G` `F` | Go to Effects Lab         |
| `G` `S` | Go to SVG Playground      |
| `G` `A` | Go to Accessibility Lab   |
| `G` `E` | Go to Export Engine       |

## Typography Studio

| Keys    | Action                         |
| ------- | ------------------------------ |
| `F`     | Focus font search              |
| `Space` | Random font pair (Pairing tab) |

## Color Studio

| Keys    | Action              |
| ------- | ------------------- |
| `Space` | Generate palette    |
| `Z`     | Undo palette change |
| `⇧` `Z` | Redo palette change |

## Icon Studio

| Keys    | Action                            |
| ------- | --------------------------------- |
| `F`     | Focus icon search                 |
| `R`     | Rotate icon 90° clockwise         |
| `⇧` `R` | Rotate icon 90° counter-clockwise |

## Background Studio

| Keys    | Action          |
| ------- | --------------- |
| `Space` | New random seed |

## Mockup Studio

| Keys | Action            |
| ---- | ----------------- |
| `]`  | Next template     |
| `[`  | Previous template |

## Social Media Studio

| Keys | Action            |
| ---- | ----------------- |
| `]`  | Next template     |
| `[`  | Previous template |

## Adding a shortcut

Bind the key with `useHotkey` from `hooks/use-hotkeys.ts` in the component that owns the action, then add a matching entry to `lib/shortcuts.ts` so it shows up in the dialog, and update this guide. `G` navigation shortcuts come from the `shortcut` field of each studio in `lib/navigation.ts`, so a new studio is listed automatically.
