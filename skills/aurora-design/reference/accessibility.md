# Accessibility

The library components are built accessible (native elements, ARIA, keyboard, focus, screen reader texts). Most failures come from what the page adds around them.

## Names and structure

- Every control has an accessible name: `label` on fields, visible text on buttons, `aria-label` on icon-only buttons (`buttonType="icon"`), `caption` on tables, `label` on charts, `aria-label` on a `TabSwitcher` or menu when there is no visible title.
- One `h1` per page, then `h2`/`h3` in order. Landmarks: the app shell gives `nav`; wrap the page content in `main` when the layout does not.
- Real elements: `<button>`/`Button` for actions, `<a>`/`LinkButton`/`href` for navigation. Never a clickable `div` or `span`.
- Icons next to visible text are decorative; meaningful icons alone need a text alternative.
- Images that carry information have an `alt` describing the information; decorative ones `alt=""`.
- Lists are `<ul>`/`<ol>`, facts are `<dl>`, groups of fields have a heading or `fieldset`/`legend`.

## Keyboard and focus

- Everything works with the keyboard; Tab order follows the visual order (do not reorder with CSS only, do not use positive `tabindex`).
- Focus is always visible: never `outline: none` without a replacement (the library uses the focus ring tokens).
- Escape closes overlays; focus returns to the element that opened them (the library does it).
- After a route change or after closing a flow, focus goes somewhere sensible (the page heading, the new record); after a failed submit, to the first error.
- Drag and drop always has a keyboard or button alternative.

## Dynamic content

- Status changes that are not in focus are announced: the `Toaster` and the field errors already are; for your own messages (a counter, "3 selected", "Saved") use one `role="status"` element with a full sentence.
- Loading regions: `aria-busy="true"` while loading if you build your own.

## Visual

- Contrast: text at least 4.5:1 (3:1 for large text), controls and icons 3:1. The text tokens meet it on the surfaces of the default theme; `--global-color-text-3` only just, so use it only for accessory text. Never grey text on colored backgrounds.
- Never convey information by color only (status with a word or icon, errors with an icon and a message, charts with labels or a table).
- The page must work at 200% zoom and with larger text: `rem` sizes, wrapping text, no fixed heights on text containers.

## Motion

- Motion only to explain a change (something opens, moves, appears), using the token durations (`--global-duration-fast` ~180ms for small feedback, `--global-duration` ~250ms, `--global-duration-slow` ~400ms for large panels) and `--global-ease`. No decorative or looping animation, no page-load choreography, no bounce.
- Animate `transform` and `opacity`, not width, height or position.
- Reduced motion: the duration tokens become 0 with `prefers-reduced-motion`; if you write an animation, use the tokens or add the media query yourself.

## Testing

Tab through the whole screen; try it at 200% zoom; check light and dark; if possible run a quick screen-reader pass (VoiceOver: Cmd+F5) on new patterns.
