# Responsive and touch

## Principles

- **Same features everywhere, different arrangement.** Never hide a function on phones; move it (menu, sheet, second screen).
- Check at least **390px** (phone) and **1280px** (laptop); also 768px for tablets when the layout changes there. No horizontal page scroll at any width (wide tables scroll inside themselves or become cards).
- Prefer layouts that reflow by themselves (`auto-fit` grids, `flex-wrap`, `minmax(min(100%, …), 1fr)`) to many media queries. When you need one, use the library breakpoints (`breakpoints`, `MediaQuery`: phones ≤425, tablets ≤768, small laptops ≤1024) or a container width such as 640px.
- Use `100dvh`, not `100vh`, for full-height areas.
- Text grows with translations (+30%): no fixed widths on buttons or text containers.

## What the library already does

- `SidebarLayout`: the sidebar becomes a drawer with a menu button under 1024px.
- `Table` / `DataTable`: rows become cards under 640px of the table width; toolbar compacts on one line; row actions stay visible on touch.
- `MenuOrDrawer`, the date and time fields, `PeriodPicker`, `Autocomplete` (opt-in): bottom sheets on phones.
- `Dialog`, `Drawer`: fit the screen.
- `Tooltip`: opens on tap on touch screens.

Do not rebuild these; just do not fight them (no fixed widths around a table, no `overflow: hidden` containers that clip).

## By device

- **Phone**: one column; the main action reachable with the thumb (bottom of a form, or the page header); shorter labels if needed (same meaning); menus and pickers as sheets; less shown at once, with "Show more".
- **Tablet**: two columns where useful (list + detail).
- **Desktop**: sidebar always visible, several panels, keyboard shortcuts, bulk actions, hover extras (never essential).

## Touch

- Touch targets at least 24×24px (WCAG 2.2 AA) with at least 8px between adjacent targets; aim for 44px for the main actions of screens used on phones (`size="lg"` buttons, full-width primary button at the bottom of a phone form).
- Nothing only on hover: hover can add a shortcut, never be the only way. Detect the input with `@media (hover: hover)` / `(pointer: coarse)`, not with the screen width.
- Every gesture (drag to reorder, swipe) has a visible button alternative. `DashboardShaper` and the column manager already offer keyboard and buttons.
- Do not disable zoom.
