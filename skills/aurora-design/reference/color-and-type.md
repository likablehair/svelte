# Color and text

The colors and fonts come from the tokens and the theme: never write hex, rgb or named colors, never set font families. This file is about **how to use** them.

## Color carries meaning

- **Mostly neutral**: surfaces (`--global-color-bg`, `-surface`, `-surface-2`, `-border`) and text tokens make up almost all of a screen. The brand color (`--global-color-primary`) is roughly a tenth of it at most.
- **Brand color only for**: the primary action, the current selection or location, focus, links, key data. Not for decoration, headings or icons that are not interactive.
- **Status colors only for status**: `success`, `warning`, `error` (and their `-soft` backgrounds) for the state of things (paid, overdue, cancelled) and for feedback. Same color, same meaning on every screen. Prefer the components that already carry them: `Chip variant`, `AlertBanner variant`, `state` on fields, toasts.
- **Never color alone**: a status also has a word or an icon (a `Chip` with text; an error with an icon and a message). Many people cannot tell red from green.
- **Text on a colored background** uses the matching pair: `--global-fill-*` backgrounds with `--global-color-on-*` text, or the `-soft` background with the full status color as text. Never grey text on a colored background.
- Charts and categories use `--global-color-data-1…6`, in order.
- Inactive and disabled things are quieter, never more saturated.

## Text hierarchy

| Role | Token / style |
|---|---|
| Main text, values, headings | `--global-color-text` |
| Secondary text, descriptions, labels of facts | `--global-color-text-2` |
| Accessory text only: timestamps, counters, captions next to a clearer element | `--global-color-text-3` |

`--global-color-text-3` is the faintest text color (just above 4.5:1 on the surfaces of the default theme): never use it for anything the user must read to act (values, errors, instructions, table content).

- Page title `h1` in `--global-font-family-display`, about `1.5`–`1.75rem`, weight 600–700; section headings `0.95`–`1.25rem`, 600; body `0.875`–`1rem`, 400; small text not below `0.75rem`.
- At most 3–4 sizes and 2–3 weights per view; sizes clearly apart (not 14/15/16px). Use `rem`, not fluid sizes.
- Headings in order (`h1` → `h2` → `h3`), chosen by structure, not by size.
- Sentence case everywhere ("Opening hours", not "Opening Hours"); avoid ALL CAPS labels except the small table headers the library already draws.
- Prose at most ~70 characters per line; tables and dense UI can be wider.
- Numbers that are compared or change (amounts, quantities, times, tables): `font-variant-numeric: tabular-nums`; the library's table and number formats already align them.
- Dates, times, money and numbers through `Intl` or the components' formats in the app's locale: `1.234,50 €` in Italian, never hand-built strings.
- Prefer wrapping to truncating; when you truncate (`text-overflow: ellipsis` with `min-width: 0` on the flex/grid child), make the full text reachable.

## Dark mode and themes

Every screen must work in light and dark and in every theme: if you only use tokens it does. Check both modes when you can. Never invert colors by hand or add `@media (prefers-color-scheme)` rules in pages.
