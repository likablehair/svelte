---
name: aurora-design
description: Designs and builds pages and UI with the @likable-hair/svelte component library (Likable Aurora, Svelte 5) using the aurora MCP server for the exact specs. Use for any UI work in an app that depends on @likable-hair/svelte 5: new pages, redesigns, forms, tables, dashboards, dialogs, layouts, styling, themes or dark mode.
---

# Designing pages with Likable Aurora

`@likable-hair/svelte` is a Svelte 5 (runes) component library. This skill is the method; the facts (props, snippets, CSS variables, examples, tokens, themes) come from the `aurora` MCP server, which reads the version installed in the app. **Never write a prop, snippet, CSS variable or token from memory**: read it first.

## Process

1. **Understand the page**: what the user does there, which data it shows, the main action, what happens on a phone.
2. **Start from a pattern**: `get_pattern` lists whole pages (list, detail, form, dashboard); `get_pattern <name>` gives the code. Keep its structure, swap data and fields. The app shell (sidebar, top bar, user menu) is `SidebarLayout`: see `get_example SidebarLayout`.
3. **Pick the components**: `list_components`, or `search_docs "<what you need>"`. Prefer the library component over custom markup every time one exists (see the table below).
4. **Read the specs** of every component you use: `get_component <Name>` (`sections: ["props", "snippets"]` when you only need those) and `get_example <Name>` for working code.
5. **Write the page** following the rules below.
6. **Check**: `validate_usage` on every file you wrote, then `npx svelte-check`. Look at the page in light and dark mode and at phone width when you can.

## Rules

- **Library components, used directly.** No local wrappers (`StandardButton`, `MyTable`): an app-wide look goes in the app CSS as CSS variables, not in a wrapper. A wrapper only when it adds real logic.
- **Style through CSS variables and tokens only.** Each component has `--{component}-*` variables (listed by `get_component`) for every part and state; pass them as style props (`<Button --button-background="…">`) or set them in the app CSS. For page CSS use the `--global-*` tokens (`get_tokens`): `--global-color-text`, `-text-2`, `-text-3` for text; `--global-color-bg`, `-surface`, `-border` for surfaces; `--global-radius-*`, `--global-shadow-*`, `--global-font-family-display` for headings. **No hex, rgb or named colors** in the app: themes and dark mode would not apply.
- **Spacing is the app's**: there are no spacing tokens; use `rem` with a consistent scale (0.5, 0.75, 1, 1.5, 2rem) and `gap` on grid/flex instead of margins.
- **Svelte 5 API**: callbacks are props receiving the native event or a plain object (`onclick={(event) => …}`, `onchange={({ value }) => …}`), never `{ detail }` or `on:`; two-way values with `bind:` only on bindable props; content through snippets named `*Snippet` (`{#snippet actionsSnippet()}`), `children` for the default content.
- **Icons are SVG paths** from `@mdi/js` (`import { mdiPlus } from '@mdi/js'`, `icon={mdiPlus}`). A clickable icon is a `Button buttonType="icon"` with `aria-label`, never a bare `Icon`.
- **Texts and dates follow the locale**: `setDefaultLocale('it')` in the root `+layout.svelte` sets it for every component; do not translate the library's own labels by hand.
- **Overlays**: `Dialog` and `Drawer` are unmounted when closed, so keep form state in the page. Put the buttons in `actionsSnippet` and point a submit button to the form with the `form` attribute.
- **Accessibility**: every field has a `label`; tables a `caption`; icon buttons an `aria-label`; validation through `state="error"` + `hint`.
- **Themes change only the look.** Do not restyle components per page to get another look: pick or create a theme (`list_themes`, `get_theme`, prompt `create-theme`), see `reference/themes.md`.

## Which component

| Need | Component |
|---|---|
| App shell with sidebar and top bar | `SidebarLayout` (+ `HierarchyMenu` options) |
| Records from a server: search, filters, paging, selection | `DataTable` (`loader`, `filterFields`, `selectionActions`) |
| Small in-memory table | `Table` (+ `Paginator`) |
| Filters alone | `Filters`, `SearchBar` |
| Action, link-looking action | `Button` (`variant`, `buttonType`), `LinkButton` |
| Confirm/cancel at the end of an inline form | `ConfirmOrCancelButtons` |
| Text, number, email, password | `SimpleTextField` |
| Long text | `Textarea` |
| One of few options / one of many | `Select` / `Autocomplete` (`AsyncAutocomplete` for server search) |
| On/off, yes/no, one of a group | `Switch`, `Checkbox`, `RadioGroup`, `ToggleList` |
| Date, range, time, date and time | `DatePickerTextField`, `TimePickerTextField`, `DateTimePickerTextField` |
| Report period with presets | `PeriodPicker` |
| Files | `FileInput`, `FileInputList` |
| Modal, side panel, menu, menu that becomes a sheet on phones | `Dialog`, `Drawer`, `Menu`, `MenuOrDrawer` (+ `MenuOrDrawerOptions`) |
| Tabs, status label, divider | `TabSwitcher`, `Chip`, `Divider` |
| Message in the page / temporary message | `AlertBanner` / `Toaster` + `addSuccessToast`… |
| Empty state, loading | `NoData`, `Skeleton`, `CircularLoader`, `ProgressBar` |
| People | `Avatar`, `AvatarGroup`, `DescriptiveAvatar` |
| History, steps | `Timeline` |
| Charts, dashboard grid | `BarChart`, `LineChart`, `PieChart`, `DashboardShaper` |
| Grid of navigation cards | `BoxList` |
| Global search (Ctrl/⌘+K) | `GlobalSearchTextField` |

The list changes between versions: when in doubt, `list_components`.

More: `reference/page-layout.md` (page structure, cards, responsive), `reference/themes.md` (themes, dark mode, creating a theme).
