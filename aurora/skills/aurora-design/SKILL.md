---
name: aurora-design
description: Designs and builds UI and UX with the @likable-hair/svelte component library (Likable Aurora, Svelte 5), using the aurora MCP server for the exact specs. Use for any interface work in an app that depends on @likable-hair/svelte 5 - new pages, flows, redesigns, forms, tables, dashboards, dialogs, navigation, empty/error/loading states, responsive and touch behaviour, accessibility, microcopy, styling, themes or dark mode - and to review or critique an existing screen.
---

# Designing UI and UX with Likable Aurora

The apps are business tools (bookings, clients, staff, stock, reports, settings). People use them every day, often in a hurry, on a desk computer or on a phone at the reception. Good design here is **invisible**: the user finds the next step without thinking, nothing looks strange, nothing surprises.

The library already decides the look (colors, fonts, radii, shadows, motion) through tokens and themes. **Your job is composition and behaviour**: which components, in which order, with which hierarchy, states, texts and responsive behaviour. Never invent an aesthetic, never restyle a component to make it "nicer".

The facts come from the `aurora` MCP server, which reads the version installed in the app: `get_component`, `get_example`, `get_pattern`, `search_docs`, `get_tokens`, `get_theme`, `validate_usage`. **Never write a prop, snippet, CSS variable or token from memory.**

## Process

1. **Brief before code.** Answer, in a few lines, the questions in `reference/brief-and-review.md`: who uses the screen and how often, the one main task, the data and its realistic sizes (0, 1, 5, 500 items), the states, what happens on a phone. If something important is unknown and changes the design, ask.
2. **Start from a pattern and from the app.** `get_pattern` lists whole pages (list, detail, form, dashboard). Look at how the same kind of screen is already done in the app: a new screen must have the same shape as its neighbours (modal vs page, inline edit vs form, same words for the same things).
3. **Structure, then components.** Decide the hierarchy (one primary action, what is secondary, what goes in a menu), the groups and the reading order. Then pick components (`list_components`, `search_docs`, table below) and read each one with `get_component` and `get_example`.
4. **Write every state**, not only the happy path: loading, empty, error, success, disabled, long texts, many items, no permission.
5. **Check.** `validate_usage` on every file you wrote, `npx svelte-check`, then look at the result when you can: light and dark, about 1280px and 390px wide, keyboard only.
6. **Critique and fix.** Run the review in `reference/brief-and-review.md` (heuristics, cognitive load, hardening) and fix what scores low before saying you are done. Remove one thing that does not serve the task.

## Core rules

**Hierarchy and layout** (`reference/layout-and-hierarchy.md`)
- One primary action per view (`Button` default variant); 1–2 secondary (`variant="secondary"`); everything else as text buttons or in a menu (`MenuOrDrawerOptions`).
- Build hierarchy with position, size, weight and space, not with color. The most important thing must be findable in 2 seconds.
- Group by proximity: small gaps inside a group, large gaps between groups. Use a spacing scale in `rem` (0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3) and `gap`, never random values.
- Left-aligned content, predictable grids, familiar patterns. Density is fine in tables and back-office screens.
- No cards inside cards; not everything needs a box.

**Actions** (`reference/actions.md`)
- Labels are verb + object ("Save changes", "Create booking", "Delete 3 clients"), never "OK", "Submit", "Yes".
- In dialogs and form footers: secondary left, primary right (`ConfirmOrCancelButtons`, or `Button`s in the `Dialog` `actionsSnippet`).
- Destructive actions use `variant="danger"`, sit apart from the primary action, and name what they destroy. Prefer **undo** (a toast with an `action`) for recoverable deletes; **confirm** in a `Dialog` only what cannot be undone.
- Async buttons show `loading` and cannot be pressed twice. Disabled actions say why (tooltip or hint) or are not shown.
- Never put an action only on hover, never behind a gesture only.

**Forms** (`reference/forms.md`)
- Every field has a visible `label`; the placeholder is only an example. Validate on blur and on submit, not on each keystroke; show the error in `hint` with `state="error"`, keep what the user typed.
- Group related fields (at most about 4 per group), the right input `type`, smart defaults, nothing asked twice.

**States and feedback** (`reference/states-and-feedback.md`)
- Every action answers: success confirmed (toast or visible change), failure explained with a way out (retry, what to do). No silent failures.
- Loading inside content uses `Skeleton` or the component's own loading state, not a big spinner. Empty states (`NoData`) say what will appear and offer the action that fills them.

**Color and text** (`reference/color-and-type.md`)
- Color carries meaning, not decoration: the brand color only for the primary action, the selection and focus; status colors only for status. Never color alone: add an icon or a word.
- Text hierarchy with the text tokens (`--global-color-text`, `-text-2`, `-text-3`) and at most 3–4 sizes per view. Numbers in tables and amounts with `font-variant-numeric: tabular-nums`, dates and money with `Intl` or the components' formats.

**Navigation and data** (`reference/navigation-and-data.md`)
- The user always knows where they are (active item in `SidebarLayout`/`HierarchyMenu`, page title, tabs). Filters, tabs and the selected record live in the URL when the view can be shared or reloaded.
- Lists of records: `DataTable` with search, `Filters`, sorting, `selectionActions` for bulk actions. Charts: line for trends, bar for comparisons, a table or summary as alternative.

**Responsive and touch** (`reference/responsive-and-touch.md`)
- Same features on every device, different arrangement. Check 390px and 1280px at least. No horizontal page scroll.
- The components already adapt (table → cards, menus and pickers → bottom sheets, sidebar → drawer under 1024px): do not rebuild that. Touch targets stay at least 24px with 8px between them; use `size="lg"` for the main actions of phone-first screens.

**Accessibility** (`reference/accessibility.md`)
- Native elements and the library components (they handle roles, keyboard and focus). Every control has a name: `label`, `aria-label` on icon buttons, `caption` on tables.
- Keyboard: everything reachable with Tab in visual order, Escape closes overlays, visible focus never removed. Headings in order (one `h1`), landmarks (`main`, `nav`).
- Do not convey anything with color only; respect reduced motion (the tokens already do); text must survive 200% zoom.

**Writing** (`reference/writing.md`)
- Words of the user's job, one term per concept, sentence case, short. Errors say what happened and how to fix it, never blame. Write in the app's language (`setDefaultLocale`), with the library texts left as they are.

**Look and style**
- Library components used directly, no local wrappers. Page CSS uses only tokens (`get_tokens`): no hex, rgb or named colors, no new shadows or radii. Component variations go through their CSS variables (`get_component` → CSS variables). Motion only to explain a change, with the token durations.
- A different look is a theme, not page CSS: `reference/themes.md`.

## Which component

| Need | Component |
|---|---|
| App shell with sidebar and top bar | `SidebarLayout` (+ `HierarchyMenu` options) |
| Records from a server: search, filters, paging, selection | `DataTable` (`loader`, `filterFields`, `selectionActions`) |
| Small in-memory table | `Table` (+ `Paginator`) |
| Filters alone | `Filters`, `SearchBar` |
| Action, link-looking action | `Button` (`variant`, `buttonType`, `size`), `LinkButton` |
| Confirm/cancel at the end of a form | `ConfirmOrCancelButtons` |
| Text, number, email, password | `SimpleTextField` |
| Long text | `Textarea` |
| One of few options / one of many | `Select` / `Autocomplete` (`AsyncAutocomplete` for server search) |
| On/off, yes/no, one of a group | `Switch`, `Checkbox`, `RadioGroup`, `ToggleList` |
| Date, range, time, date and time | `DatePickerTextField`, `TimePickerTextField`, `DateTimePickerTextField` |
| Report period with presets | `PeriodPicker` |
| Files | `FileInput`, `FileInputList` |
| Modal, side panel, menu, menu that becomes a sheet on phones | `Dialog`, `Drawer`, `Menu`, `MenuOrDrawer` (+ `MenuOrDrawerOptions`) |
| Tabs, status label, divider | `TabSwitcher`, `Chip`, `Divider` |
| Message in the page / temporary message | `AlertBanner` / `Toaster` + `addSuccessToast`, `addErrorToast`… |
| Empty state, loading | `NoData`, `Skeleton`, `CircularLoader`, `ProgressBar` |
| Extra explanation on hover and focus | `Tooltip` |
| People | `Avatar`, `AvatarGroup`, `DescriptiveAvatar` |
| History, steps | `Timeline` |
| Charts, dashboard grid | `BarChart`, `LineChart`, `PieChart`, `DashboardShaper` |
| Grid of navigation cards | `BoxList` |
| Global search (Ctrl/⌘+K) | `GlobalSearchTextField` |

The list changes between versions: when in doubt, `list_components`.

## References

Read the one you need when you need it:

| File | When |
|---|---|
| `reference/brief-and-review.md` | before designing (questions, brief) and before finishing (review, scores, hardening) |
| `reference/layout-and-hierarchy.md` | page structure, hierarchy, spacing, grids, cards, density |
| `reference/actions.md` | buttons, their order and placement, destructive actions, confirm or undo, menus |
| `reference/forms.md` | fields, validation, errors, long forms, forms in dialogs |
| `reference/states-and-feedback.md` | loading, empty, error, success, toasts, optimistic updates |
| `reference/navigation-and-data.md` | navigation, URLs, tables, filters, bulk actions, charts, dashboards |
| `reference/color-and-type.md` | color meaning, contrast, text hierarchy, numbers |
| `reference/responsive-and-touch.md` | breakpoints, phone layouts, touch targets, hover |
| `reference/accessibility.md` | keyboard, focus, names, screen readers, motion, zoom |
| `reference/writing.md` | labels, errors, empty states, confirmations, Italian and English |
| `reference/themes.md` | themes, dark mode, creating a theme, brand color |
