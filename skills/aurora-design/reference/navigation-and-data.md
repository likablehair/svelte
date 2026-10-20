# Navigation and data screens

## Navigation

- **Where am I**: the active item in `SidebarLayout`/`HierarchyMenu` (`currentPath`), the page title, the selected tab. For deep hierarchies (3+ levels) a "back to parent" `LinkButton` above the title.
- Top-level sections are few (around 5–7 items, grouped under headings when more), named with the user's words ("Agenda", "Clients", "Staff", "Reports", "Settings"), with icon **and** label. The sidebar collapses to icons with tooltips on desktop and becomes a drawer under 1024px by itself.
- Do not mix navigation systems at the same level (sidebar + top tabs + another menu for the same sections). Tabs (`TabSwitcher`) are for sections **inside** one page or record.
- Put the state of a view in the URL when it can be shared, reloaded or reached with Back: filters, search, page, selected tab, open record. Back must return to the same list with the same filters and scroll.
- Global search and quick jumps: `GlobalSearchTextField` (Ctrl/⌘+K) in the top bar.
- Light/dark choice: `ModeSwitch` on the right of the top bar next to the user (`size="sm"` when crowded), or in a row at the bottom of the sidebar with `tooltipPlacement="top"`; one per app.
- A record opens in its own page when it has a lot to show or edit; in a `Drawer` when the user works through a list one by one; inline when it is a single value.

## Tables and lists of records

- Server data: `DataTable` (`get_pattern list-page`). It already has search, `Filters`, sorting, paging, column manager, selection with "select all results", a card view under 640px, loading, empty and error states. Use them instead of building your own.
- Columns: the identifying column first and `pinned` (name of the client), then what the user scans or sorts by, amounts and numbers right-aligned with `type: 'number'` and formats, dates with `type: 'date'`/`'datetime'`. Hide secondary columns (`hidden: true`) and let the column manager show them. Status as a `Chip` with text, not only a color dot.
- Actions: one row → `actionsSnippet` (1–2 icon buttons + "⋯" menu); many rows → `selectable` + `selectionActions` with counts in the labels; page-level → `toolbarSnippet`. Do not repeat the same per-row button when a bulk action exists.
- Clicking a row opens it (`rowHref` for a link, which also allows Ctrl-click; `onrowclick` otherwise).
- Make it easy to clear: search, filters and selection each have a visible reset.
- Long texts: let cells wrap or truncate with the full value available (tooltip or the record page); never truncate the identifying column into ambiguity.
- Small, local lists: `Table` (+ `Paginator`). Lists of navigation targets: `BoxList`. History: `Timeline`.

## Dashboards and charts

- Start from the question the screen answers. At most ~4 key numbers at the top, each with a comparison (period before, target) and the period visible (`PeriodPicker` drives the page).
- A number is shown only if it is real and useful; no decorative "hero metrics".
- Chart type follows the data: trend over time → `LineChart`; comparison between categories → `BarChart` (horizontal when labels are long); parts of a whole with ≤5 parts → `PieChart` (donut). Otherwise a table.
- Every chart has a `label` (the components add a table for screen readers), a title saying what it measures, the unit in the format, and loading/empty states. Colors come from the theme (`data-1…6`); do not set chart colors by hand unless they carry a fixed meaning.
- Details belong in a linked list or report, not crammed into the dashboard.

## Search and filters

- Search for "find a known thing", filters for "narrow a set". `DataTable` debounces search and runs both together.
- Offer the filters the user actually uses (`filterFields`), with presets for the frequent ones; show active filters as pills that can be removed one by one.
- No results → say which filters are on and offer to clear them.
