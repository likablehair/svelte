# Layout and hierarchy

## Page structure

A page inside the app shell (`SidebarLayout`) is usually:

1. **Header**: title (`h1`, `--global-font-family-display`), optionally one line of description (`--global-color-text-2`), and the page actions on the right: one primary, the others secondary or in a menu.
2. **Attention** (optional): an `AlertBanner` for what the user must act on now. Not for general information.
3. **Content**: one main component (a `DataTable`, a form, a set of sections), or sections switched by a `TabSwitcher`.

The page container is a grid with `gap: 1.25rem`–`1.5rem` and `padding: 1.5rem` (`1rem` on phones). Give long content a `max-width` (forms ~60rem, prose ~70ch); tables and dashboards can use the full width.

## Hierarchy

- **Budget**: one primary element, 2–3 secondary, everything else quiet. If everything is bold, nothing is.
- Build it with 2–3 dimensions together: **position** (top-left first), **size** (a clear step: at least ~1.25× between levels), **weight** (bold vs regular; medium vs regular is too weak), **space** (more space around what matters). Color is the last resort and carries meaning, not rank.
- Reading order is top-left to bottom-right: the summary or the main control first, details after. In dialogs and form footers the primary button is bottom-right.
- **Squint test** and **2-second test** (see `brief-and-review.md`).

## Spacing

There are no spacing tokens: use one scale in `rem` and nothing outside it: `0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3`.
- Inside a group (label and value, related fields, buttons of a bar): `0.5`–`0.75rem`.
- Between groups in a card or form: `1`–`1.5rem`.
- Between sections of a page: `1.5`–`3rem`.
- Siblings get `gap` on their grid or flex parent, not margins. Equal spacing everywhere means no grouping: vary it on purpose.

## Grids and alignment

- Left-align text and controls; center only empty states and single messages.
- Card and section grids reflow without media queries: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr))`; small indicators `min(100%, 9rem)`.
- Two-column forms (explanation left, fields right) become one column under 640px.
- Keep the same alignment edge for header, content and footer.
- Give `min-width: 0` to grid and flex children that contain long text or tables, so they shrink instead of overflowing.

## Cards and containers

There is no card component: a card is an element with the surface tokens.

```css
.card {
	padding: 1.25rem;
	border: var(--global-border-width) solid var(--global-color-border);
	border-radius: var(--global-radius-lg);
	background: var(--global-color-surface);
	box-shadow: var(--global-shadow-sm);
}
```

- Use a card only for a distinct, self-contained block (a section of a detail page, an indicator, a chart). Not for every group.
- **Never a card inside a card**: inside, separate with space, a heading or a `Divider`.
- Not every list of things is a grid of identical cards (icon + title + text repeated): a table or a list is often clearer.
- Section titles inside cards are small (`0.85`–`0.95rem`, `--global-color-text` or `-text-2`); facts are a `<dl>` grid with `dt` in `--global-color-text-3`.

## Density

Business screens can be dense: many rows, many columns, compact controls are fine when the user needs to compare and scan. Dense does not mean cramped: keep the spacing scale, align numbers, keep the header and the actions clear. Settings and forms can breathe more.

## Limits that keep a screen simple

- At most ~4 options at a decision point (5–7 is the edge); more go into a menu or a select.
- At most ~4 fields per group before a break.
- At most ~4 key numbers above the fold on a dashboard.
- Everything needed for a decision on the same screen: do not make the user remember a value from another page.

## Overlays and layers

Overlays come from the library (`Dialog`, `Drawer`, `Menu`, `Tooltip`, toasts) and sit on the top layer: do not add `z-index` values or `position: absolute` menus of your own. Prefer inline editing or a page to a modal when the content is long or is the main task; a `Drawer` keeps the list visible behind a record.
