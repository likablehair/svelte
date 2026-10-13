# Migrating from v4 to v5

Version 5 of `@likable-hair/svelte` is a rewrite. This file lists everything that can break, or look different, in an app that moves from the latest 4.x to 5.0: removed or renamed props, changed types and defaults, callbacks, snippets, CSS variables and behaviour. New optional features get one line per component, since they break nothing.

It is updated together with every ported component. Components that v5 does not have yet are listed in [Not available yet](#not-available-yet).

Contents:

- [Checklist](#checklist)
- [Global changes](#global-changes)
- [Components](#components): [ActivableButton](#activablebutton), [AlertBanner](#alertbanner), [AsyncAutocomplete](#asyncautocomplete), [Autocomplete](#autocomplete), [Button](#button), [Calendar](#calendar), [Checkbox](#checkbox), [Chip](#chip), [CircularLoader](#circularloader), [ConfirmOrCancelButtons](#confirmorcancelbuttons), [CountriesAutocomplete](#countriesautocomplete), [DatePicker](#datepicker), [DatePickerTextField](#datepickertextfield), [DateTimePickerTextField](#datetimepickertextfield), [Dialog](#dialog), [Divider](#divider), [Drawer](#drawer), [Dropdown](#dropdown), [FilterEditor](#filtereditor), [Filters](#filters), [FlagIcon](#flagicon), [HorizontalStackedProgress](#horizontalstackedprogress), [Icon](#icon), [LinkButton](#linkbutton), [Menu](#menu), [MonthSelector](#monthselector), [NoData](#nodata), [ProgressBar](#progressbar), [RadioButton](#radiobutton), [SearchBar](#searchbar), [Select](#select), [SimpleTextField](#simpletextfield), [Skeleton](#skeleton), [Switch](#switch), [TabSwitcher](#tabswitcher), [Textarea](#textarea), [TimePickerTextField](#timepickertextfield), [Toaster](#toaster), [Tooltip](#tooltip), [YearPickerTextField](#yearpickertextfield), [YearSelector](#yearselector)
- [Not available yet](#not-available-yet)

## Checklist

1. Use Svelte 5.29 or later.
2. Add the cascade layer line to the app CSS and move resets into `@layer reset` ([CSS layers](#css-layers-and-app-css)).
3. Replace every v4 color token (`--global-color-primary-500`, `rgb(var(...))`) with the v5 tokens ([Tokens](#color-tokens)).
4. Replace `.dark` / `.light` and `setTheme('dark')` with `setMode('dark')` and `[data-mode]` ([Dark mode](#dark-mode-and-themes)).
5. Replace MDI class names (`"mdi-plus"`) with SVG paths from `@mdi/js` (`mdiPlus`) in every icon prop ([Icons](#icons)).
6. Remove `.detail` from callbacks ([Callbacks](#callbacks)).
7. Install the packages the app imports directly but used to get through v4 (`luxon`, `lodash`, `date-fns`, ...).
8. In an Italian app call `setDefaultLocale('it')` in the root `+layout.svelte` ([Language of the texts](#language-of-the-texts)), and replace `toISOString()` on the values of the date components with `toISODate()` ([Dates](#dates)).
9. Convert v4 filter definitions to `fields` + `value` and `FilterConverter` calls to `filtersToBuilder`; check the backend before enabling OR groups or `json` casts, and leave out the operators the backend cannot replay (`operatorSet="basic"`, `typeOperators` or field `operators`) on backends that reject `null`, `column` and subqueries ([Filters and queries](#filters-and-queries), [Filters](#filters)).
10. Go through the [component sections](#components) for each component the app uses.

## Global changes

### Package

- **Runtime dependencies**: v4 had 16 (`chart.js`, `date-fns`, `luxon`, `lodash`, `imask`, `sortablejs`, `svelte-dnd-action`, ...). v5 has only `flag-icons`. Declare in the app's `package.json` every package the app imports itself.
- **Svelte**: the peer range is still `^5.0.0`, but the components need **5.29 or later** (`{@attach}`).
- **`@mdi/js`**: add it to the app if it uses MDI icons. v5 only has it as a dev dependency.
- **Exports**: `@likable-hair/svelte/package.json` is no longer exported. New: `./tokens.css`, `./base.css`, `./themes/*.css`, `./tailwind.css`, `./tailwind-preset`.
- **CSS side effects**: v4 components imported `main.css` (the v4 palette) and Icon loaded the MDI webfont from the jsdelivr CDN, making `.mdi` classes global. v5 components import `tokens.css`; nothing is loaded from a CDN. `base.css` (page background, text, font, `accent-color`, `::selection`) and the themes are opt-in imports.
- **Browsers**: v5 relies on `light-dark()`, `color-mix()`, `:has()`, `popover`, `<dialog>.showModal()` and `@layer`: Chrome/Edge 123+, Firefox 125+, Safari 17.5+.
- **Language**: the default texts follow `locale` and `setDefaultLocale`, English without either; see [Language of the texts](#language-of-the-texts).
- **Ids** come from `$props.id()` (stable with SSR) instead of random ids.

### CSS layers and app CSS

All library CSS lives in cascade layers: tokens and `--{component}-default-*` in `global.base`, themes in `global.theme`, component rules in `global.components`.

- **Add the layer order at the top of the app's main CSS**:

  ```css
  @layer reset, theme, base, global, components, utilities;
  ```

  A theme file of the app must use the full form, `@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;`.
- **Unlayered app CSS now always wins over the components**, whatever its specificity. In v4 the scoped component rules usually won.
  - `class="..."` and `:global(...)` overrides work without `!important`.
  - Global element rules (`button { ... }`, `input`, `select`, `label`, `dialog`, `h2`, `* { margin: 0 }`) now restyle the inside of the components: move resets into `@layer reset { ... }`.
- **Tailwind 3**: wrap `@tailwind base;` in `@layer reset { ... }`, otherwise the preflight removes Button backgrounds and component borders. Add `presets: [aurora]` from `@likable-hair/svelte/tailwind-preset` (ESM: use `import`).
- **Tailwind 4**: put the layer line before `@import 'tailwindcss'`, then `@import '@likable-hair/svelte/tailwind.css'`. The preset and `tailwind.css` redefine `rounded-{xs,sm,md,lg,xl}`, `shadow-{sm,md,lg}`, `font-sans` and `font-mono`.
- **Overrides of tokens and defaults** must be unlayered (or in a layer above `global`). An override in Tailwind 3's `@layer base`, which ends up inside `reset`, loses.
- **Internal class names changed**. v4 used generic scoped classes (`.button`, `.chip`, `.textfield`, `.hint`, `.row`, `.overlay`, `.selection-container`, `._teleported`, `[data-dialog]`). v5 uses `aurora-{component}` and `aurora-{component}-{part}` classes, and exposes state as `data-*` attributes (`.aurora-button[data-variant='primary']`). App CSS that targeted v4 internals stops matching.

### Color tokens

v4 tokens (`--global-color-{background|contrast|grey|primary|secondary|error|warning|success}-{50..950}`, RGB triplets used as `rgb(var(--x))`) and their overrides (`--global-color-light-*`, `--global-color-dark-*`) **do not exist in v5**. Nothing reads them: overrides stop working, and app CSS that uses them gets an undefined variable (transparent backgrounds, inherited colors). v5 never reuses a v4 name, so leftovers are dead rather than wrong.

v5 tokens are full colors with a light and a dark value (`light-dark()`). Use `var(--global-color-x)`, not `rgb(var(...))`; for transparency, `color-mix(in oklab, var(--global-color-x) 40%, transparent)` (Tailwind 4: `bg-primary/40`).

The mapping is by role, not by step number:

| v4 | Typical role | v5 |
|---|---|---|
| `background-50` | page | `--global-color-bg` |
| `background-100` | panels, drawers, tooltips | `--global-color-surface-solid` (opaque) or `--global-color-surface`; page bands `--global-color-bg-2` |
| `background-200` | subtle fills, hover | `--global-color-surface-2` |
| `background-300` | selected fills; borders | fills `--global-color-surface-3`, borders `--global-color-border` |
| `background-400`, `-500` | separators, input borders | `--global-color-border-strong` |
| `contrast-900`, `-950` | main text | `--global-color-text` |
| `contrast-700`, `-800` | secondary text | `--global-color-text-2` |
| `contrast-500`, `-600` | muted text, placeholders | `--global-color-text-3` |
| `contrast-50` ... `-300` | borders, dividers, light shadows | `--global-color-border`, `--global-color-border-strong`, `--global-shadow-*` |
| `primary-500` | brand | `--global-color-primary`; filled backgrounds `--global-fill-primary` |
| `primary-600`, `-700` | hover or pressed | `--global-color-primary-strong` |
| `primary-50` ... `-400`, `primary-500` at 20% | tints, selection | `--global-color-primary-soft` |
| `primary-500` at 40% | glows, rings | `--global-color-primary-glow`, `--global-focus-ring-color` |
| `grey-50` on primary | text and icons on primary | `--global-color-on-primary` |
| `grey-900` | overlay | `--global-color-overlay` (+ `--global-overlay-blur`) |
| `secondary-*` | accent | `--global-color-accent`, `--global-color-accent-soft` |
| `error-*`, `warning-*`, `success-*` | states | `--global-color-{error,warning,success}`, `-soft`, `--global-color-on-{error,warning,success}`, `--global-fill-error` |
| chart colors | data series | `--global-color-data-1` ... `-6` |

The `classic` theme (`@likable-hair/svelte/themes/classic.css`) reproduces the v4 colors on the v5 tokens.

Derived tokens (`-strong`, `-soft`, `-glow`, focus ring, fills) follow the base color, but only when it is overridden on `<html>`.

### Dark mode and themes

| | v4 | v5 |
|---|---|---|
| Light/dark | `.dark` / `.light` class on `<html>`, or the OS | `color-scheme`: follows the OS by default, `data-mode="light" \| "dark"` on `<html>` forces it |
| Set it | `setTheme('dark')`, `toggleTheme()` | `setMode('light' \| 'dark' \| 'system')` |
| "Theme" | light or dark | a named design theme: `setTheme('classic')` sets `data-theme` |
| Read it | `theme` store (`$theme.dark`) | `getMode()`, `getTheme()` (not reactive) |
| Persistence | automatic, `localStorage.theme`, on import | none: the app stores the choice and restores it, ideally with an inline script in `app.html` that sets `data-mode` / `data-theme` before the first paint |

- `setTheme('dark')` still type-checks in v5 but activates a theme called "dark", which does not exist. Use `setMode('dark')`.
- `toggleTheme()` → `setMode(isDark ? 'light' : 'dark')`, where `isDark` is `getMode() === 'dark'`, or `getMode() === 'system'` and `matchMedia('(prefers-color-scheme: dark)').matches`.
- The functions use `document`: call them in the browser (`onMount`, event handlers).
- `setTheme` and `setMode` pause CSS transitions during the switch (attribute `data-switching` on `<html>`), so the colors change at once instead of animating every component.
- **The `.dark` / `.light` classes do nothing in v5.** Tailwind `darkMode: 'class'` no longer follows the library; for Tailwind 3 use `darkMode: ['variant', ['&:is([data-mode="dark"] *)', '@media (prefers-color-scheme: dark) { &:not([data-mode="light"] *) }']]`, for Tailwind 4 an `@custom-variant dark` with the same two branches.
- **v5 sets `color-scheme: light dark` on `<html>`**: on a dark OS, scrollbars, native controls and the default page colors turn dark even if the app never styled for dark. An app without dark mode sets `data-mode="light"` on `<html>`.
- An unlayered app rule that sets `color-scheme` on `:root` freezes the mode, and `setMode` stops working.

### Icons

- `<Icon name="mdi-plus">` → `<Icon path={mdiPlus}>`, with `import { mdiPlus } from '@mdi/js'` (same icon set, camelCase names).
- **Every icon prop takes an SVG path** on a 24×24 viewBox: Button `icon` / `appendIcon`, SimpleTextField `prependIcon` / `prependInnerIcon` / `appendInnerIcon` / `appendIcon`, Chip `prependIcon` / `closeIcon`, Autocomplete and Dropdown `icon`, `Item.icon`. These props are typed `string`, so an old `"mdi-..."` value type-checks and silently draws nothing.
- The global `.mdi` classes are gone: app markup with `class="mdi mdi-..."` needs `@mdi/font` loaded by the app.
- Icon is no longer clickable: see [Icon](#icon).

### Callbacks

v4 wrapped callback data in `{ detail: {...} }`. v5 passes native events for element events and plain objects for composite data.

- `onclick({ detail: { nativeEvent } })` → `onclick(event)`: `e.detail.nativeEvent` → `e`.
- `onchange({ detail: { select, unselect, selection } })` → `onchange({ select, unselect, selection })`: `e.detail.x` → `e.x`.
- `MouseEvent.detail` is a number: leftover `e.detail.nativeEvent` is `undefined` at runtime and a type error with TypeScript.

### Language of the texts

Every component with texts of its own (accessible names such as `closeLabel`, messages such as `invalidText` or `noResultsText`, button texts such as `confirmText`, default placeholders and titles) has a **`locale`** prop, a BCP 47 tag that also sets the formats of the date and time components (the date format, the names in the calendar, the first day of the week, the 12- or 24-hour clock) and the names in CountriesAutocomplete. Italian (`it`, `it-IT`, ...) and English are built in; any other language gets the English texts (and its own formats through `Intl`).

**`setDefaultLocale` sets it for the whole app**, once, in the root layout. It is a Svelte context, so it is safe with SSR and reaches every library component rendered inside the layout, the Toaster and the content of dialogs included:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { setDefaultLocale } from '@likable-hair/svelte';

	let { children } = $props();

	setDefaultLocale('it');
</script>

{@render children()}
```

With paraglide pass a function, `setDefaultLocale(() => getLocale())` (`getLocale` from `$lib/paraglide/runtime`), so the components read the active language; a function that reads reactive state (`$state`, a store read with `$`) is followed when it changes.

**Precedence**: a text prop passed by the app (`closeLabel="Esci"`) wins over everything; then the component's `locale` prop; then `setDefaultLocale`; then `en`. Without `locale` and without `setDefaultLocale` every v5 default is English (MM/dd/yyyy, 12-hour clock, weeks from Sunday).

v4 was not consistent: the date components were always Italian (dd/MM/yyyy, Italian names, weeks from Monday), some texts were Italian ("Annulla" / "Salva", "N Selezionati"), others English with a `lang` prop that defaulted to `en` (Dropdown, NoData, Filters, FilterEditor). With `setDefaultLocale('it')` all of them are Italian:

- drop `locale="it"` where it only restored the Italian default, and the Italian texts passed only to translate an English default (`invalidText="Inserisci una data valida"`, `closeLabel="Chiudi"`, `cancelText="Annulla"`, ...);
- v4 `lang="it"` → `locale="it"` or nothing; `lang="en"` → `locale="en"` only where English is wanted;
- components that v4 showed in English without `lang` (the Dropdown placeholder "Select", NoData "No data available", Filters) become Italian: pass `locale="en"` where that matters;
- components rendered outside the layout (`mount()`, tests, a second root) need their own `setDefaultLocale` or `locale`.

The Filters keep their own `labels` for single texts (see [Filters](#filters)); the other components take one prop per text.

### Fonts

The library does not load fonts, as in v4, but the tokens now name them: `--global-font-family` (Geist), `--global-font-family-display` (Bricolage Grotesque), `--global-font-family-mono` (Geist Mono), all with a `system-ui` fallback. They are used by Dialog and Drawer titles, the CountriesAutocomplete dialing code and, with `base.css`, the page. Either load those fonts or set the tokens to the app's fonts in an unlayered `:root`.

### Overlays

- **Top layer instead of teleport and z-index.** Dialog and Drawer are native `<dialog>` elements opened with `showModal()`, Menu is a `popover`. They stay where they are written in the markup and are drawn above everything, whatever its z-index. App elements (toasts, chat widgets, third-party popups appended to `<body>`) cannot be stacked above an open Dialog or Drawer.
- **The page is inert while a Dialog or Drawer is open**: elements outside it cannot be clicked or focused.
- **They inherit from where they are written**: style props now reach the content (in v4 they were lost), and so do fonts, colors and custom properties of the ancestors. DOM events from the content bubble through those ancestors, and a Dialog written inside a `<form>` joins that form.
- **Dialog and Drawer content is unmounted when closed**: its local state resets at every opening and must live in the parent.
- **Escape closes only the topmost overlay or menu** and calls `preventDefault()`. App-level Escape handlers should check `event.defaultPrevented`.
- **Scroll lock** is CSS only (`html:has(.aurora-dialog:modal) { overflow: hidden }`); an unlayered app rule on `html { overflow }` defeats it. v4 wrote `body.style.overflow`.
- Menus dispatch an `aurora:menu-open` event on `document`.

### Responsive

The `mediaQuery` store and the `MediaQuery` component are not in v5: use `MediaQuery` from `svelte/reactivity`. Components switch to their mobile variant at 1024px as before, but the **server now renders the desktop variant** (v4 rendered the mobile one).

### Dates

The date components work with `Date` values at **local midnight**. `date.toISOString()` converts to UTC and returns the previous day in Italy (local midnight is 22:00 or 23:00 UTC of the day before), and `new Date('2026-10-09')` reads the string as UTC midnight. Use the exported helpers instead:

- `toISODate(date)` → `'2026-10-09'` (local), in place of `toISOString()`, `.toISOString().split('T')[0]` or `.slice(0, 10)`;
- `parseISODate('2026-10-09')` → local midnight (or `undefined`), in place of `new Date(text)`;
- `toISODateTime(date)` → `'2026-10-09T14:30'` (local, the value of `DateTimePickerTextField`'s hidden input and of `<input type="datetime-local">`) and `parseISODateTime(text)` → `Date` (local, or the instant when the text has a zone).

luxon conversions (`DateTime.fromJSDate(d).toISODate()`, `DateTime.fromISO(s).toJSDate()`) are correct, but the app now has to declare `luxon` (and `imask`, if it uses it) in its own `package.json`.

### Filters and queries

The filter UI is redesigned (see [Filters](#filters)); the query format sent to the backends is not.

- **`FilterBuilder`**: same name, methods and `toJson()` output (verified against v4 on the same calls). Fixed bugs that code may have relied on: `where({ a: 1 })` did nothing and now adds a `kind: 'object'` condition; `where(key, operator, undefined)` sent the operator as the value and is now skipped; `toJson()` and `modifiers` return copies (v4 `toJson()` returned the internal array); `hasWhereOnColumn` looks inside groups and subqueries. New: `whereNotIn`, `orWhereNotIn`, `whereNotNull`, `orWhereNotNull`, `whereBetween(key, [from, to])`, `clone()`, `FilterBuilder.fromJson(json)`, `orderBy(column)` with `'asc'` default, `toQueryParam()` (the whole query as one JSON string, for GET requests: see below), and the types `JsonQuery`, `Modifier`, `WhereModifier`, `JoinModifier`, ...
- **`FilterConverter` / `Converter`** (the same class) are removed with the v4 `Filter` type. `new FilterConverter().createBuilder({ filters })` → `filtersToBuilder(value, fields)`, where `fields` are the definitions and `value` the tree of applied conditions (see [Filters](#filters)). To add the filters to an existing query (search, sort, tenant) pass it as `{ builder }`: it is copied, and its joins stay first. It has no DOM dependency: use it in load functions, `+server.ts`, exports and jobs. Inside a Filters `onchange` the builder is already in the argument.
- **`FilterValidator.isValid(filter)`** → `isConditionComplete(condition, field)`. Operators without a value (`empty`, `isTrue`, ...) are always complete; a field can decide with `isComplete(condition)` (where the v4 custom filters passed `valid` to `updateFunction`); by default a custom value is complete when it is not `undefined`, `null`, `''`, an empty array or an empty object. `countFilters(value, fields)` counts the complete, visible conditions.
- **`DynamicFilters`** is removed: its master-detail list (Filters `contentSnippet` inside DynamicTable) is replaced by the Filters panel. The internal `MobileFilterEditor` became the Filters bottom sheet, and the table quick filters (internal `QuickFilters`) become Filters `pinned` fields ("missing value" = operator `empty`, a three-state bool = `isTrue` / `isFalse` / no condition) and `presets`.
- **Types**: `FilterField` (and one per type), `FilterGroup`, `FilterCondition`, `FilterItem`, `FilterPreset`, `SavedFilter`, `FilterRelative`, `FilterTimeUnit`, `FilterLabels` are exported from the package root, with the Italian texts `FILTER_LABELS_IT`.

**Backends.** The appliers (`FilterModifierApplier` in each app backend) replay the modifiers with different fidelity. Check before turning features on:

- **Selects** send `where(column, '=', v)` (`notIn`: `'<>'`) with one value and `kind: 'in'` (`notIn`: `logicalOperator: 'andNot'`) with several, instead of a group of `orWhere` (v4 `equal`) or `whereNot` (v4 `different`). Every applier handles both, and it fixes lupette and likable-tools, whose appliers flatten groups and broke the v4 select OR.
- **OR and nested groups** are off by default (`allowOr`, `maxDepth={0}`): AND only, as in v4. With OR at the root, Filters wraps every condition in one `grouped` (never an OR at the first level, where backends add the tenant scope).

  | Applier | Apps | OR / groups |
  |---|---|---|
  | A | astro, ermes, h24, maya, quantum, cbam | correct at every level |
  | B | biblio, biblio-smart-folder, contattorapido, tatum, addibox, stramoniumai | OR only inside a group (how Filters sends it) |
  | C | billboards, mufasa, emarket | groups always joined with AND |
  | D | ganymede | one level of groups |
  | E | lupette, likable-tools | groups flattened without parentheses |
  | E' | epass, new-vigipass | groups always AND; no automatic `%` on like/ilike |

  Managers that read first-level modifiers by key (astro, cbam, ganymede, maya, lupette, quantum, stramoniumai) stop seeing a condition once it is inside an OR group.
- **Kinds**: A–D replay `null`, `column`, `inBuilder` and `jsonSuperset`. E (lupette, likable-tools) and E' (epass, new-vigipass) know only `simple`, `object`, `grouped` and `in`, and throw "where kind not supported" for `empty` / `notEmpty` (`whereNull`), `compareWith` and `whereColumn` in `whenTrue` (`column`), `through` (`inBuilder`) and `json`. On those apps pass `operatorSet="basic"` to Filters (the `standard` default includes `empty` / `notEmpty`), or `typeOperators` / the field `operators` without them, and avoid those options; or add the missing branches to the applier, copying them from variant A.
- **GET requests**: Adonis parses the query string with `qs` at depth 5 and `arrayLimit` 20, and no app raises them. Anything deeper than `filtersBuilder[modifiers][i][children][j][key]` is mangled without errors: arrays inside a group or a subquery become `{ "[0]": ... }` (a select with two or more values inside an OR group, a `through` field with two or more values, `whereIn` with a callback), and a group inside a group loses its children. Arrays longer than 20 become objects (v4 selects had the same limit). Numbers and booleans become strings, also inside objects (a `json` field without `cast` sends `{ visits: 5 }`, which arrives as `{ visits: "5" }` and stops matching). Fixes, in order of preference:
  1. send the whole query as one JSON string, `filtersBuilder: builder.toQueryParam()`, and in the backend read it with `typeof input === 'string' ? JSON.parse(input) : input` (one line; the old format keeps working);
  2. raise `http.qs.parse.depth` and `arrayLimit` in the backend `config/app.ts`;
  3. send `builder.toJson()` in a POST body.
- **Dates**: fields with `dateOnly: true` send `yyyy-MM-dd` strings; the others send `Date` values (ISO UTC timestamps) for the start and end of local days, as v4.
- **like / ilike**: `contains` sends `ilike '%v%'` with `%`, `_` and `\` escaped. Appliers A–E wrap like/ilike values in `%` again (same results); E' does not, so a v4 `ilike` filter was an exact, case-insensitive match there. They add `%` only when the operator is exactly `like` or `ilike`: every other text operator reaches Postgres unchanged (all the backends use `pg`). `notContains` sends `not ilike '%v%'`; `startsWith` / `endsWith` send the regex operators `~*` (`~` with `caseSensitive`) with `^v` / `v$`, regex characters escaped.
- **Postgres arrays** (select `array: true`): `in` sends `where(column, '&&', [...])`, `all` `'@>'`, `notIn` `whereNot(column, '&&', [...])`, `empty` `whereNull` or `= '{}'` (the empty array as a Postgres literal, so GET requests keep it). They are simple wheres, replayed by every applier that knows `null`.
- **JSON keys** (`json` on a field): without `cast` the equalities send `kind: 'jsonSuperset'` (A–D; nested keys become nested objects, negations a `whereNot` group). With `cast` every operator sends `kind: 'raw'`, clause `(??#>>?)::<cast> <operator> ?`, bindings `[column, '{key,path}', value]`: only B replays `raw`, A, C and D throw. This relies on B running whatever SQL condition a client sends, an injection risk that exists already. Prefer accepting `raw` in the backend only for whitelisted columns and that exact clause shape, or expose the key as a real column or a view.
- Security, outside the library: the appliers accept any column, table and subquery from the client (B also passes `kind: 'raw'` to `whereRaw`); a whitelist of fields per manager is recommended.

**Saved state.** v4 apps kept `Filter[]` in stores, `sessionStorage` or URL presets and re-applied `active` / `value` by hand. The v5 `value` is plain JSON: store `serializeFilters(value)` and restore it with `parseFilters(json, fields)` (unknown fields are dropped, invalid input gives an empty tree). For the URL, `filtersToParam(value)` is the same tree without node identities and `filtersFromParam(url.searchParams.get('filters'), fields)` reads it back; presets made of separate parameters build the tree in the load function (`createFilters([filterCondition('status', 'in', [{ value, label }])])`). Compute the first query there with `filtersToBuilder(value, fields)` and pass `value` to the page for `bind:value`. Keep `fields` in a module shared by the page and the load function. Named sets kept by the app (saved views) become Filters [saved filters](#filters-saved). Saved trees and URL parameters include `locked` conditions: keep tenant and permission constraints in the `builder` prop or in the backend. Saved v4 arrays cannot be parsed: convert them once or drop them.

## Components

### ActivableButton

- `buttonProps` removed: Button props go directly on ActivableButton (`buttonProps={{ disabled }}` → `disabled`). `variant` and `buttonType` are not accepted.
- `onclick` receives the native event (no `detail`). As in v4, the click flips `active` before `onclick` runs.
- The state is announced with `aria-pressed`.
- Look: neutral surface with a border when off, primary tint when on (v4: transparent text button, filled primary when on). Buttons with text and no icon show a state dot: `dot={false}` hides it.
- Icon-only buttons take `icon={mdiFormatBold}` and an `aria-label` instead of an `<Icon>` child, and are square like an icon-only Button.
- `--button-*` color variables passed to it are ignored: use the `--activable-button-*` ones. Layout variables (`--button-padding`, `--button-height`, ...) still work.

| v4 | v5 |
|---|---|
| `--activable-button-deactive-background-color`, `-deactive-color` | `--activable-button-background`, `--activable-button-color` |
| `--activable-button-active-background-color`, `-active-color` | `--activable-button-active-background`, `--activable-button-active-color` |
| `--activable-button-hover-deactive-background-color` | `--activable-button-hover-background` (+ `-hover-color`, `-hover-border-color`) |
| `--activable-button-hover-active-background-color`, `-hover-active-color` | `--activable-button-active-hover-background`, `--activable-button-active-hover-color` |
| `--activable-button-active-{active,deactive}-*`, `--activable-button-focus-*` | removed (pressed and focus states come from Button) |

New, optional: `dot`, `dotSnippet`, `--activable-button-border-color` / `-active-border-color`, `--activable-button-dot-*`, `data-active`.

### AlertBanner

- Look: a tinted banner with a border and a colored icon box, in four variants (v4: a white card with a shadow and a colored strip on the left). Pick the color with `variant` (`info` \| `success` \| `warning` \| `error`, default `info`).
- `--alert-banner-color` (the strip color) has no equivalent and is ignored: use `variant`, or `--alert-banner-background`, `--alert-banner-border-color`, `--alert-banner-icon-background`, `--alert-banner-icon-color` for a custom color. The v4 default (`--my-var-blue`) was an undefined variable.
- **No clickable banner**: `disabled` and `--alert-banner-cursor` are removed. `onclick` and `onkeypress` are no longer props: they still type-check and work as native attributes of the root `<div>` (no role, not focusable, so keyboards cannot trigger them) and receive the native event. Put a `Button` or `LinkButton` in `appendSnippet` instead.
- `contentSnippet({ title, description })` → `children` (no parameters: use your own variables).
- `titleSnippet` and `descriptionSnippet` are rendered even without `title` / `description` (v4: only when the prop was set).
- `appendSnippet({ disabled })` → `appendSnippet()` without parameters.
- `class.border` removed (no strip); `class` keys are now `container`, `icon`, `body`, `title`, `description`.
- It has `role="alert"` (warning, error) or `role="status"` (info, success), so screen readers announce it when it appears (v4: `role="presentation"`). Pass `role` to change it.
- Title 14px / 600 (v4: 1.2rem / 700), description 13px.

| v4 | v5 |
|---|---|
| `--alert-banner-color` | removed: `variant` or the color variables above |
| `--alert-banner-border-width` (strip width, default `.7rem`) | same name, now the border around the banner: delete v4 values |
| `--alert-banner-padding-top`, `-right`, `-bottom`, `-left` | `--alert-banner-padding` (shorthand) |
| `--alert-banner-cursor` | removed |

Unchanged: `--alert-banner-width`, `-border-radius`, `-box-shadow` (default now none). Defaults: `--alert-banner-default-padding-top`, `-right`, `-bottom`, `-left` → `--alert-banner-default-padding`; `--alert-banner-default-border-width` now sets the border (v4: `.7rem` strip); `--alert-banner-default-color` and `-default-cursor` removed.

New, optional: `variant`, `icon`, `iconSnippet`, `closable`, `closeLabel`, `closeSnippet`, `locale` (language of the texts), `onclose`, native attributes, `data-variant`, `--alert-banner-gap`, `-icon-*`, `-title-*`, `-description-*`, `-close-*`, `-focus-ring-*`.

### AsyncAutocomplete

Everything in [Autocomplete](#autocomplete) applies, since AsyncAutocomplete forwards its props.

- `searcher({ searchText })` → `searcher({ searchText, signal })`. The text is trimmed, and a newer search aborts the older one through `signal`: pass it to `fetch`. Responses that arrive late are ignored.
- `items` is no longer overwritten by the results. It now means **suggestions shown below `searchThreshold`**, filtered locally; without them the list says "Type at least N characters". v4 kept showing the last results, unfiltered.
- `search` (boolean command) → method `search()` through `bind:this`. It uses the current text and ignores the threshold.
- `searching` now works and is bindable (`bind:searching`): it is `true` while a search waits for the debounce or runs, that is once the trimmed text reaches `searchThreshold` with the list open (and after `search()`).
- `closeOnSelect` defaults to `!multiple` (v4: `false`): a single selection now closes the list.
- `searchFunction` is no longer accepted: the server filters.
- A magnifier icon is shown at the start of the field by default; `icon=""` removes it.
- Searches run only while the list is open. Opening it with enough text searches at once; reopening with the same text reuses the last results.
- A failed search shows an error row ("Couldn't load results") and calls `onerror(error)`. In v4 it was an unhandled rejection.
- The `Item` type is no longer re-exported from this component: import it from the package root.

New, optional: `thresholdText`, `errorText`, `onerror`, `errorSnippet({ error, search })`, `searchThreshold={0}` (load on open), `--async-autocomplete-skeleton-*`.

### Autocomplete

**Props**

| v4 | v5 |
|---|---|
| `menuOpened` | `open` (bindable, no default) |
| `emptySearchTextOnMenuClose` | `clearSearchOnClose` |
| `menuAnchor` | `placement`, see the [Menu value mapping](#menu); default `'bottom-center'` → `'bottom-start'` |
| `width`, `maxWidth` | `--autocomplete-width` (now `100%`), `--autocomplete-max-width` |
| `minWidth` (`200px`), `height` | removed: `class.container` or app CSS; the field height is `--autocomplete-min-height` |
| `menuWidth` | removed: the list is as wide as the field; adjust with `--menu-min-width` / `--menu-max-width` |
| `menuMaxHeight` | `--autocomplete-menu-max-height` |
| `menuBoxShadow`, `menuBorderRadius` | `--menu-box-shadow`, `--menu-border-radius` |
| `menuStayInViewport`, `menuFlipOnOverflow` | removed: always on |
| `adaptInputWidth` | removed: the input always fills the space (`--autocomplete-input-min-width`) |
| `openingId` | removed: opening a menu closes the others |

`width` and `height` still type-check (they are `<input>` attributes) but no longer size the component.

**Types and behaviour**

- `Item.icon` is an SVG path. `Item` is exported from the package root and its `Data` defaults to `unknown` (was `any`).
- Values are compared with `===` only (v4 mixed `==` and `===`): `{ value: 1 }` and `{ value: '1' }` are different options.
- Duplicate `value`s in `items` or `values` throw an error (keyed lists).
- `closeOnSelect={true}` now also works with `multiple`.
- The default search ignores accents and matches `label ?? value`. `searchFunction` receives a `string` (not `string | undefined`).
- `searchText` keeps its initial value and becomes `''` (not `undefined`) when the list closes.
- `disabled` really disables the input; with `mandatory` the last chip has no remove button.
- It is an ARIA combobox and the focus stays in the input: options are no longer tab stops. Arrows open the list; while typing, the **first match is highlighted and Enter picks it**; Enter on a highlighted option **no longer submits the form**; Backspace on an empty field removes the last value; Escape closes the list and keeps the focus.
- `mobileDrawer`: the bottom drawer contains its own search field and a title (`drawerTitle ?? label`); the page input becomes read-only. v4 showed only the list.

**Callbacks**

- `onchange({ detail: { select, unselect, selection } })` → `onchange({ select, unselect, selection })`. With single selection, replacing a value now reports the old one in `unselect`.
- `onfocus` and `onblur` are the native input events (`FocusEvent`). `onclose` now fires on every close, not only for the mobile drawer.
- If an `onkeydown` handler calls `preventDefault()`, Autocomplete skips its own key handling.

**Snippets**

- `menuSnippet` removed: use `itemSnippet`, `loadingSnippet`, `emptySnippet` and `--menu-*`.
- `itemSnippet` (now `{ item, index, selected, highlighted }`) replaces the **content** of an option, not the option: click handling, role and highlight stay.
- `itemLabelSnippet` replaces only the label; the icon and check mark stay (use `itemIconSnippet`).
- `hintSnippet` renders inside the hint element (`aria-describedby`).
- `selectionContainerSnippet` receives `attributes` (combobox ARIA), to spread on the custom trigger.

**`class`**: `{ activator, menu, simpleTextfield, hint }` → `{ container, label, field, input, chip, menu, option, hint }` (`activator` → `container` or `field`).

**CSS variables**

| v4 | v5 |
|---|---|
| `--autocomplete-background-color` | `--autocomplete-background` |
| `--autocomplete-border` | `--autocomplete-border-width` + `--autocomplete-border-color` |
| `--autocomplete-focus-border` | `--autocomplete-focus-border-color` |
| `--autocomplete-focus-box-shadow` | `--autocomplete-focus-ring-width` + `--autocomplete-focus-ring-color` |
| `--autocomplete-selected-item-background-color`, `-color` | `--autocomplete-option-selected-background`, `-color` |
| `--autocomplete-focused-item-*`, `--autocomplete-hover-item-*` | `--autocomplete-option-highlighted-background`, `-color` |
| `--autocomplete-input-margin-left` | `--autocomplete-input-padding` |
| `--autocomplete-input-width` | `--autocomplete-input-min-width` |
| `--autocomplete-options-max-width`, `--autocomplete-hint-margin-left` | removed |

The `-default-*` names follow the same renames (`--autocomplete-default-background-color` → `--autocomplete-default-background`, ...). Unchanged: `--autocomplete-border-radius`, `--autocomplete-padding`, `--autocomplete-min-height` (2rem → 36px), `--autocomplete-hint-font-size`, `--autocomplete-hint-color`. Chips inside follow the [Chip](#chip) variables.

Internal classes: `.selection-container` → `.aurora-autocomplete-field`, `.selection-item` → `.aurora-autocomplete-option`, `.focused` → `[data-highlighted]`, `.selected` → `[data-selected]`.

New, optional: `label`, `state`, `name`, `id`, `icon`, `loading`, `drawerSearch`, `drawerTitle`, texts (`loadingText`, `noResultsText`, `removeLabel`, `closeLabel`) and `locale` (language of the texts), `bind:input`, snippets `labelSnippet`, `stateIconSnippet`, `iconSnippet`, `chipIconSnippet`, `itemIconSnippet`, `itemAppendSnippet`, `loadingSnippet`, `emptySnippet`, `data-*` state attributes.

### Button

- `icon`: SVG path. `buttonElement` is an `HTMLButtonElement`.
- Callbacks are native: `onclick(event)`, `onkeydown(event)`, `onkeypress(event)`. They do not fire while `disabled` or `loading`, also with `href`.
- **`disabled` is now native**: a disabled button is not focusable and does not submit forms (v4 never passed it to the `<button>`).
- **`loading`** disables the button and replaces only the icon with a 16px spinner (or adds it before the text); the text stays. v4 swapped all the content for a 30px loader and stayed clickable.
- `children` and `icon` render together; an icon without text gives a square icon-only button.
- `appendSnippet` sits after the text in the flow, pushed to the end, instead of over the text.
- Look: fixed heights (`size`: 28/34/40px), 1px border, `box-sizing: border-box`, labels do not wrap.
  - `buttonType="text"`: no uppercase, color from `variant` (primary by default; `variant="secondary"` for body text).
  - `buttonType="icon"`: rounded square in the `variant` colors instead of a circle (`--button-border-radius: 9999px` for a circle).
  - Focus ring on `:focus-visible` instead of a background change.

**CSS variables**

| v4 | v5 |
|---|---|
| `--button-background-color` | `--button-background` |
| `--button-hover-background-color` | `--button-hover-background` |
| `--button-border` | `--button-border-width` + `--button-border-color` |
| `--button-focus-background-color`, `-focus-color`, `-focus-box-shadow` | `--button-focus-ring-width`, `-color`, `-offset` |
| `--button-active-background-color`, `-active-color`, `-active-box-shadow` | `--button-active-transform` |
| `--button-disabled-background-color`, `-disabled-color` | `--button-disabled-opacity`, `--button-disabled-filter` |
| `--icon-size` on a Button | `--button-icon-size` |
| `--circular-loader-*` | `--button-icon-size`, `--button-spinner-border-width`, or `loadingSnippet` |
| `--button-max-height`, `-min-height`, `-box-sizing`, `-text-align`, `-cursor`, `-display`, `-justify-content`, `-align-items` | removed |

Unchanged: `--button-width`, `-min-width`, `-max-width`, `-height` (now border-box), `-padding` (ignored on icon-only buttons), `-color`, `-hover-color`, `-border-radius`, `-box-shadow`, `-hover-box-shadow`, `-font-size`, `-font-weight`.

Defaults are now per variant and size: `--button-default-background-color` → `--button-default-primary-background`, `--button-default-color` → `--button-default-primary-color`, `--button-default-hover-background-color` → `--button-default-primary-hover-background`, `--button-default-text-hover-background-color` → `--button-default-primary-text-hover-background`, `--button-default-box-shadow` → `--button-default-primary-box-shadow` (likewise for `secondary`, `danger`, `gradient`); `--button-default-padding`, `-border-radius`, `-height`, `-font-size` are the `md` values (`-sm-*`, `-lg-*` for the others). The v4 focus, active, disabled and icon defaults are removed.

New, optional: `variant`, `size`, `appendIcon`, `iconSnippet`, `loadingSnippet`, `href` (renders an `<a>`; with `target`, `rel`, `download`), `data-variant` / `data-size` / `data-shape` / `data-loading`.

### Calendar

- `type="dateRange"` → `range`; `type="singleDate"` → drop it.
- **`locale` defaults to the one of `setDefaultLocale`, else `'en'`** (v4: `'it'`): call `setDefaultLocale('it')` in the root layout ([Language of the texts](#language-of-the-texts)), or add `locale="it"` where it was omitted. It takes any BCP 47 tag (`Intl`), and the first day of the week follows it (`weekStart` overrides it).
- `showExtraMonthDays` → `showOutsideDays` (hidden days are empty cells; in v4 they stayed clickable), `showHeader` → `showWeekdays`, `animationDuration={300}` → `--calendar-duration="300ms"`.
- `visibleMonth` / `visibleYear` default to the month of `selectedDate` and follow it when it moves to another month (v4: the current month).
- **Days of the nearby months can be chosen**: a click selects the day and shows its month (v4 ignored it). With `range`, the same day clicked twice is a one-day range, and hovering a day previews the band.
- `ondayClick({ detail: { dateStat, selected, extraMonth } })` → `ondayClick({ date, outside, nativeEvent })`, with `date` a `Date` at local midnight: `dateStat.dayOfMonth` / `.month` / `.year` → `date.getDate()` / `.getMonth()` / `.getFullYear()`, `extraMonth` → `outside`. v4 `dayOfWeek` was the column index, not the weekday; `selected` was always `!extraMonth`. It fires only for days that can be chosen, after the selection changed. For the value, `onchange({ selectedDate, selectedDateTo })` is new.
- `weekHeaderSnippet({ header, index })` → `weekdaySnippet({ label, name, day })` (`day` is the weekday, 0 = Sunday, not the column). `daySnippet({ dayStat, extraMonth, selected })` → `daySnippet(day)` with `CalendarDay` `{ date, outside, selected, inRange, today, disabled }`; it replaces only the number.
- `class.weekHeader` → `class.weekday`.
- It is an ARIA grid: one Tab stop, arrows by day and week, Home/End, Page Up/Down by month (with Shift, by year), Enter and Space choose; screen readers read the full date. v4 cells were not focusable.
- Look: always 6 rows of 32px days (v4: only the rows needed, stretched to the parent height), short weekday names (`weekdayFormat="narrow"` for the v4 single letter), today marked by a dot (v4: a pale red circle), outside days at 50% opacity (v4: 30%), a continuous range band; the new month slides in.
- Markup: `.calendar-container`, `.week-header-slot`, `.day-slot`, `.extra-month`, `.today`, `.selected`, `.between-range`, `.range-start`, `.range-end` → `.aurora-calendar`, `.aurora-calendar-weekday`, `.aurora-calendar-day` with `[data-outside]`, `[data-today]`, `[data-selected]`, `[data-range]`.

| v4 | v5 |
|---|---|
| `--calendar-height` | removed: the height follows the rows; size them with `--calendar-day-height` |
| `--calendar-day-height` | same name, `100%` → `32px` (a length now) |
| `--calendar-grid-gap` | `--calendar-row-gap` (rows only, default 2px) |
| `--calendar-day-background-color`, `--calendar-day-hover-background-color` | `--calendar-day-background`, `--calendar-day-hover-background` |
| `--calendar-day-border-radius` | same name, now the radius of every day state (v4 `0px`, v5 `--global-radius-sm`) |
| `--calendar-day-hover-border-radius`, `--calendar-selected-day-border-radius`, `--calendar-range-start-border-radius`, `--calendar-range-end-border-radius` | removed: `--calendar-day-border-radius` |
| `--calendar-selected-day-background-color` | `--calendar-selected-day-background` |
| `--calendar-selected-day-color` | same name; the default is the text color on primary, so `rgb(var(--global-color-primary-foreground))` can be dropped |
| `--calendar-today-background-color` | `--calendar-today-background` (fills the day; the dot is `--calendar-today-dot-color`, `-dot-size`) |
| `--calendar-today-color` | same name, default `inherit` |
| `--calendar-today-border-radius`, `--calendar-today-height` | removed: today is a dot |
| `--calendar-between-range-background-color`, `--calendar-between-range-color` | `--calendar-range-background` (also behind the ends), `--calendar-range-color` |

Unchanged: `--calendar-width`, `--calendar-day-width`. The `-default-*` names follow the same renames.

New, optional: `min`, `max`, `isDateDisabled`, `weekStart`, `weekdayFormat`, `variant="grid"` (agenda cells), `dayAppendSnippet`, `onchange`, `focus()`, `bind:calendarElement`, native attributes, `data-*` on the grid and the days, `--calendar-*` for colors, font, weekdays, today dot, range preview, opacity, focus ring, duration and easing.

### Checkbox

- `value` → `checked` (`bind:value` → `bind:checked`). `value` is now the native form value: `value={true}` compiles but leaves the box unchecked.
- `onchange({ detail: { shiftKeyPressed, nativeEvent } })` → native `onchange(event)`. For Shift+click use `onclick(event)` and `event.shiftKey`: true for a Shift+click on the box and, in Chromium, for Shift+Space and a Shift+click on the label text (Firefox reports Shift+Space without Shift and does not toggle on a Shift+click on the text). The two global `window` listeners per checkbox are gone.
- `class`: string → `{ container, input, label }` (`class="x"` → `class={{ input: 'x' }}`).
- The root is a `<label>` around the input (attributes still go to the input). Do not wrap it in another `<label>`: use `label` or `labelSnippet`.
- Size 21px → 18px; focus ring on `:focus-visible`; disabled is opacity .4 on the whole label.

| v4 | v5 |
|---|---|
| `--checkbox-background-color` | `--checkbox-background` |
| `--checkbox-active-color` | `--checkbox-checked-background` + `--checkbox-checked-border-color` |
| `--checkbox-active-inner-color` | `--checkbox-mark-color` |
| `--checkbox-border-hover-color` | `--checkbox-hover-border-color` |
| `--checkbox-focus-shadow` | `--checkbox-focus-ring-width` + `-color` + `-offset` |
| `--checkbox-disabled-color`, `-disabled-active-color` | `--checkbox-disabled-opacity` |

Unchanged: `--checkbox-border-color`. Defaults follow the same renames (`--checkbox-default-active-color` → `--checkbox-default-checked-background`, ...). `--checkbox-default-disabled-inner-color` was declared in v4 but never read: delete it.

New, optional: `indeterminate` (bindable), `label`, `labelSnippet`, `bind:input`.

### Chip

- `inactive` → `selected={!inactive}`. The default look is neutral (v4: filled primary); for the v4 look use `selected` or `variant="filled"`.
- `close` → `closable` (no longer bindable), `buttonTabIndex` → `tabindex` (a number, not `null`).
- `truncateText` removed: text always ends with an ellipsis when there is no room (`--chip-max-width`).
- `closeIcon` default: circled × → plain ×; pass `mdiCloseCircle` for the v4 icon. `prependIcon`, `closeIcon`: SVG paths.
- `onclick({ detail: { native } })` → `onclick(event)`; `onclose({ detail: { native } })` → `onclose(event)`. The remove click is no longer stopped: it bubbles.
- Markup: a `<span>` that contains a `<button>` only when `onclick` is set (otherwise not focusable, no hover), plus a sibling remove `<button>`. v4 was a `<div role="button">` with the remove button inside. `display: inline-flex` instead of `flex`.
- Size: 26px (md) / 22px (sm), 12.5px font, single line.
- Toggle chips: in the selected state `--chip-selected-*` win over `--chip-background`, `--chip-color`, `--chip-border-color` and `--chip-box-shadow`; `--chip-hover-*` win over both and are the same for both states (v4 had separate hover colors for active and inactive chips: keep one).

| v4 | v5 |
|---|---|
| `--chip-background-color` | `--chip-background` (for toggle chips: `--chip-selected-background`) |
| `--chip-color` | same name, now applies in every state (for toggle chips: `--chip-selected-color`) |
| `--chip-hover-background-color` | `--chip-hover-background` |
| `--chip-inactive-background-color`, `-inactive-color`, `-inactive-border-color` | `--chip-background`, `--chip-color`, `--chip-border-color` |
| `--chip-inactive-border` | `--chip-border-width` + `--chip-border-color` |
| `--chip-inactive-hover-background-color`, `-inactive-hover-color` | `--chip-hover-background`, `--chip-hover-color` |
| `--chip-focus-background-color`, `--chip-inactive-focus-*` | `--chip-focus-ring-width`, `-color`, `-offset` |
| `--chip-min-height` | `--chip-height` |
| `--chip-text-max-width` | `--chip-max-width` (whole chip) |
| `--button-*` for the remove button | `--chip-close-*` |
| `--icon-size` on a Chip | `--chip-icon-size`, `--chip-close-icon-size` |
| `--chip-cursor`, `--chip-line-height` | removed |

Unchanged: `--chip-height`, `-padding`, `-gap`, `-border-radius`, `-font-size`, `-font-weight`. Defaults: `--chip-default-background-color` / `-color` → `--chip-default-selected-*` or `--chip-default-{variant}-*`; `--chip-default-inactive-background-color`, `-inactive-color`, `-inactive-border-color` → `--chip-default-neutral-background`, `-neutral-color`, `-neutral-border-color`. The hover and focus defaults (`--chip-default-hover-background-color`, `--chip-default-inactive-hover-*`, `--chip-default-inactive-focus-*`, ...) have no counterpart: delete them.

New, optional: `variant`, `size`, `selected`, `closeLabel`, `locale` (language of the texts), `bind:chipElement`, `class` and native attributes, `prependSnippet`, `closeSnippet`.

### CircularLoader

- Look: a ring with a fading tail in the theme gradient (v4: a Material-style arc). Default size 32px (v4: 30px); the thickness is 10% of the size.
- **Color**: in v4 `--circular-loader-color` had no effect (it overwrote `width`) and the loader always took the text color (`currentColor`). In v5 the default is the theme gradient. Where the loader sits on a colored background (inside a primary button, on a filled banner), pass `--circular-loader-color="currentColor"`.
- `loading` removed: with `false` it hid the arc but kept the space. Use `{#if}` to remove the loader, or `visibility: hidden` on a wrapper to keep the space.
- It is a `role="progressbar"` named "Loading" by default (v4 had no role). Next to a text that already says it, pass `label=""` to hide it from screen readers.
- `class` is now on a `<span>` (v4: on the `<svg>`).

| v4 | v5 |
|---|---|
| `--circular-loader-height` | `--circular-loader-size` (always square) |
| `--circular-loader-width` | removed: it had no effect in v4, delete it |
| `--circular-loader-color` | same name, now works (any color or gradient) |

New, optional: `value` and `total` (progress ring), `children` in the middle, `label` (default "Loading", "Caricamento" in Italian), `locale` (language of the texts), native attributes, `data-indeterminate`, `--circular-loader-thickness`, `--circular-loader-track-color`, `--circular-loader-duration`, `--circular-loader-value-duration`, `--circular-loader-content-*`. New component: `DotsLoader` (three dots that light up in turn).

### ConfirmOrCancelButtons

- **Default texts follow the locale**: "Annulla" / "Salva" with `it` (`setDefaultLocale('it')` or `locale="it"`), "Cancel" / "Save" otherwise. Apps that relied on the Italian defaults call `setDefaultLocale('it')` ([Language of the texts](#language-of-the-texts)); `cancelText` and `confirmText` still win.
- **No top margin**: `marginTop` (default 20px) is removed. Add the spacing in the app layout, or with `class={{ container: '...' }}`.
- `onconfirmClick({ detail: { nativeEvent } })` → `onconfirmClick(event)`, same for `oncancelClick`. Svelte 4 apps using `on:confirm-click` / `on:cancel-click` switch to these props.
- In `cancelButtonSnippet` and `confirmButtonSnippet`, `handleCancel` and `handleConfirm` take the native event (v4: `handleConfirm` took Button's `{ detail }` event). `cancelButtonSnippet` also receives `cancelDisable`.
- `cancelDisable` now really disables the cancel button (v4: it only skipped the callback). `onconfirmClick` is not called while `loading`.
- The cancel button is a text Button (v4: an unstyled `<button>`).
- Stacking: the buttons stack at full width, confirm on top, when their container is narrower than 480px (v4: when the viewport was under 769px). In a wide container on a phone they stay in a row; in a narrow drawer on desktop they stack.
- The root is a size container (`container-type: inline-size`): in a flex row with automatic width it collapses to zero width. Give it a width (`flex: 1` or `width: 100%` through `class.container`) or put it in a block.

New, optional: `locale` (language of the texts), `confirmIcon`, `cancelIcon`, `confirmVariant`, `confirmType`, `children` (content at the start of the row), `class` object, CSS variables `--confirm-or-cancel-buttons-*`, `data-loading`.

### CountriesAutocomplete

Everything in [Autocomplete](#autocomplete) applies.

- `autocompleteProps={{ ... }}` → pass the Autocomplete props directly on the component (in v4 callbacks inside it were silently lost).
- `bind:selected` → `bind:values`. `class.flagIcon` → `class.flag`.
- **Names** come from the browser (`Intl.DisplayNames`) in `locale`, default the one of `setDefaultLocale`, else `'en'`, and the list is **sorted by name** (v4: by code). In English 48 of the 249 names differ from v4 (for example "Czech Republic" → "Czechia").
- Values can be set with the code alone (`[{ value: 'IT' }]`); labels are filled in with the name in `locale`, also in `onchange` and in the bound `values`, replacing a custom label of the value.
- Search ignores accents, also matches the ISO code ("us" → United States) and ranks the results: names that start with the text, then the code, then names with a word that starts with it, then the rest.
- Flags are 4:3 instead of square. `--countries-autocomplete-flag-icon-size`, used in the v4 docs, never existed: use `--flag-icon-size`.
- Country utilities:

  | v4 | v5 |
  |---|---|
  | `countriesList` (`{ alpha2, name }[]`) | `countryCodes` + `countryName(code, locale)` |
  | `countriesOptions` (`{ value, label }[]`, by code) | `countryItems(locale, codes?)` (`Item<CountryData>[]`, by name, with `data.dialCode`) |
  | `getCountryInfoByAlpha2(code)` | `countryName(code, locale)`: any case; an unknown code returns the code itself instead of `undefined` |

New, optional: `locale`, `dialCode`, `class.dialCode`, `dialCode(code)`, `CountryData`, `--countries-autocomplete-dial-code-*`.

### DatePicker

What [Calendar](#calendar) says about `range`, `locale`, the days of the nearby months, `ondayClick`, the keyboard and the `--calendar-*` variables applies to its grid; `--calendar-*` set on a DatePicker still reach it.

- **The colored header** with the year and the chosen date is gone: the panel is a title ("October 2026") between two arrows above the grid, on a popup surface 280px wide (border, radius, padding, shadow) whose height follows the content (v4: 100% wide, 400px high). `headerLabelSnippet` removed; `titleSnippet({ title, month, year, view })` replaces the title text.
- Clicking the title goes days → months → years → days; choosing a year shows its months and choosing a month its days, without changing the date. `view` is bindable and follows the navigation (v4: read once).
- `selectedYear` / `selectedMonth` removed (in v4 they were not linked to the date): use `bind:visibleYear` / `bind:visibleMonth`. `onyearClick` / `onmonthClick` removed: bind `visibleYear`, `visibleMonth` and `view` instead.
- `selectableYears` → `min` / `max` (`Date`s): the year view is a scrolling 4-column grid of every year between them (default 1900–2100; v4: the 75 years before and after today), and they also disable days, months and arrows.
- `skipTabs` removed: each view is one Tab stop. The arrows have accessible names in the language of `locale` ("Mese precedente" in Italian; `previousMonthLabel`, `nextMonthLabel`, `previousYearLabel`, `nextYearLabel` change them); every button is `type="button"` (v4 header buttons submitted forms).
- `disabled` disables the title, the arrows and the grids (v4: only the days).
- `class`: `{ container, header, selectorRow }` → `{ container, header, title, calendar }` (`selectorRow` → `header`; the v4 `header` band is gone).
- `locale` defaults to the one of `setDefaultLocale`, else `'en'` (v4: `'it'`).
- Markup: `.date-picker-container`, `.header`, `.selector-row`, `.selector-text` → `.aurora-date-picker` (`data-view`, `data-disabled`), `.aurora-date-picker-header`, `.aurora-date-picker-title`.

| v4 | v5 |
|---|---|
| `--date-picker-height` | removed: the height follows the content |
| `--date-picker-width` | same name, `100%` → `280px` |
| `--date-picker-box-shadow` | same name, default `--global-shadow-lg` with a border |
| `--date-picker-overflow` | removed |
| `--date-picker-header-background-color`, `--date-picker-header-color` | removed with the header; do not move the color to `--date-picker-title-color` (the title sits on the surface) |
| `--date-picker-default-primary-color` | removed (never read) |

The `-default-*` names follow.

New, optional: `min`, `max`, `isDateDisabled`, `weekStart`, `weekdayFormat`, `showOutsideDays`, `showWeekdays`, `titleSnippet`, `daySnippet`, `dayAppendSnippet`, `weekdaySnippet`, `onchange`, the arrow labels, `focus()`, `bind:datePickerElement`, native attributes, `--date-picker-*` for padding, gap, background, border and title.

### DatePickerTextField

- **`locale`**: v4 had none and was always Italian (dd/MM/yyyy, weeks from Monday). v5 takes `locale`, else the one of `setDefaultLocale`, else `'en'`: **MM/dd/yyyy**, weeks from Sunday and English texts, so "05/03/2026" becomes May 3. Call `setDefaultLocale('it')` in the root layout ([Language of the texts](#language-of-the-texts)): the format, the calendar, the texts and the chip (`gg/mm/aaaa`) are then Italian without `locale="it"` on every usage.
- `menuOpened` → `open`; `type="dateRange"` → `range`; `pattern` → `format` (tokens `dd`, `MM`, `yyyy` only, any separator; the default comes from `locale`); `mobileDialog` → `mobileDrawer`.
- `minYearInRange` / `maxYearInRange` → `min` / `max` as `Date`s (`min={new Date(1900, 0, 1)}`), which now limit typing and the calendar. Usually drop them: the year view spans 1900–2100 and any year can be typed.
- Removed: `openingId` (opening a menu closes the others), `flipOnOverflow` (always on), `selectedYear`, `selectedMonth`, `visibleMonth`, `visibleYear` (the calendar opens on the month of the date).
- **It closes after a choice** (`closeOnSelect`, default `true`; with `range`, after the end). `ondayClick` is removed: delete handlers that only closed the menu (`ondayClick={() => (open = false)}`) together with `bind:menuOpened` when nothing else reads it; move other code to `onchange`.
- `oninput({ detail: { datetime, type } })` → `onchange({ selectedDate, selectedDateTo })`: it fires when the value changes (a whole valid date typed or made invalid, the calendar, the clear button), not at every key. `oninput` is now the native input event.
- Typing: digits only with the separators added, paste (also `yyyy-MM-dd`) and autofill work, the value updates on `input` (v4: keydown + 30ms). A date that does not exist, is outside `min` / `max`, or is unfinished when the field loses focus shows the error state with `invalidText` ("Enter a valid date", "Inserisci una data valida" in Italian) and makes the form invalid. Clicking a month or a year in the calendar no longer empties the text.
- Range: a start and an end input with an arrow between them, named by `startLabel` / `endLabel` ("Start date" / "End date", "Data di inizio" / "Data di fine" in Italian) after the `label`; a typed end before the start is not accepted.
- Keyboard: focus or click opens the calendar (desktop), Arrow Down moves into it, Escape closes it and returns to the field, Tab closes it, Enter with the calendar open closes it without submitting the form.
- Mobile (up to 1024px): the calendar button opens a bottom Drawer titled `drawerTitle ?? label` (v4: a centered Dialog); the field stays typable with the numeric keyboard.
- Ids are generated (v4: fixed `from` and `to`, duplicated with two fields on a page): use `id` (the end input is `<id>-to`) or `bind:input` / `bind:inputTo`.
- Snippets: `activatorSnippet` removed (it could not connect the mask); `prependInnerSnippet` → `iconSnippet` (it replaces the calendar icon, the button stays); `prependSnippet`, `appendSnippet` and `appendInnerSnippet` take no parameters.
- `class`: `{ activator, textfield: { container, row, field, input, hint } }` → `{ container, label, row, field, input, hint, picker }` (`activator` → `container`, `textfield.*` flattened).
- Look: 36px bordered field in the mono font, the calendar button at the start, a chip with the format at the end (`showFormat={false}` hides it), 100% of the container (v4: a 280px filled grey field in a `fit-content` wrapper); the calendar opens aligned to the start of the field (`placement`, v4 centered).
- `--date-picker-*` and `--calendar-*` passed to the field still reach the calendar, now also in the drawer, with the renames of [DatePicker](#datepicker) and [Calendar](#calendar). Drop `--date-picker-header-color` and the `--calendar-selected-day-color` that went with it; the popup surface is the Menu's (`--menu-*`).
- App wrappers (`StandardDatePickerTextfield`): type the props as `ComponentProps<typeof DatePickerTextField>` and spread the rest on the field. Without `setDefaultLocale('it')` in the app, set `locale="it"` inside the wrapper; the Italian texts come with it, so drop those the wrapper passed only to translate.

The v4 field was styled with SimpleTextField variables passed to DatePickerTextField. On this component they become `--date-picker-text-field-*`:

| v4 (on DatePickerTextField) | v5 |
|---|---|
| `--simple-textfield-width` | `--date-picker-text-field-width` (default `100%`; v4 280px) |
| `--simple-textfield-height`, `--simple-textfield-padding` | `--date-picker-text-field-height` (36px, border-box), `-padding` (keep the horizontal part) |
| `--simple-textfield-border` | `--date-picker-text-field-border-width` + `-border-color` |
| `--simple-textfield-background-color` | `--date-picker-text-field-background` |
| `--simple-textfield-focus-box-shadow` | `--date-picker-text-field-focus-ring-width` + `-ring-color`, `-focus-border-color` |
| `--simple-textfield-margin-bottom` | `--date-picker-text-field-gap` |
| `--simple-textfield-focus-background-color`, `-margin-left`, `-hint-margin-left`, `-transition`, `-range-text-align` | removed |
| `--simple-text-field-width`, `--textfield-width` (no effect in v4) | `--date-picker-text-field-width` |

The others only change prefix (`max-width`, `outer-gap`, `inner-gap`, `border-radius`, `box-shadow`, `font-size`, `font-weight`, `color`, `hint-font-size`, `hint-color`). `--simple-textfield-default-*` map to `--date-picker-text-field-default-*` the same way (`--simple-textfield-default-radius`, which did not exist, to `-default-border-radius`; `--simple-textfield-default-margin` is dropped).

New, optional: `label`, `hint`, `state`, `invalidText`, `min`, `max`, `isDateDisabled`, `weekStart`, `weekdayFormat`, `showOutsideDays`, `name` / `nameTo` (hidden inputs with `yyyy-MM-dd`), `required`, `readonly`, `id`, `clearable`, `showFormat`, `formatLabel`, `drawerTitle`, texts (`openLabel`, `closeLabel`, `clearLabel`, `startLabel`, `endLabel`, `previousMonthLabel`, `nextMonthLabel`, `previousYearLabel`, `nextYearLabel` for the calendar arrows), snippets `labelSnippet`, `hintSnippet`, `stateIconSnippet`, `clearSnippet`, `formatSnippet`, `daySnippet`, `dayAppendSnippet`, `bind:input` / `bind:inputTo`, native input attributes, `data-*` state attributes.

### DateTimePickerTextField

New in v5: one field for a date and a time, with a `DatePicker` and a `TimePicker` side by side in its panel (stacked in the mobile drawer). v4 had none, so apps pair a date field and a time field in local components (`StandardDateTimePicker` in six apps, value `Date`; `StandardDateTimePickerTextfield` in stramoniumai, value `selectedDateTime`). Replace each wrapper usage and delete the wrapper:

```svelte
<!-- v4 app -->
<StandardDateTimePicker name="startsAt" label="Start" bind:value={startsAt} />

<!-- v5 -->
<DateTimePickerTextField label="Start" name="startsAt" bind:value={startsAt} />
```

- The value stays a `Date` with the local date and time (seconds at 0). An empty or invalid field is `undefined`: the wrappers defaulted to `new Date()` (now), so pass `value={new Date()}` where that default mattered.
- `name` submits one hidden input with the local `yyyy-MM-ddTHH:mm` (read it back with `parseISODateTime`), instead of the date input (`name`) and the time input (`name-time`) of the wrappers.
- Italian apps get dd/MM/yyyy, the 24-hour clock and the Italian texts from `setDefaultLocale('it')` ([Language of the texts](#language-of-the-texts)) or `locale="it"`: the default `en` is MM/dd/yyyy with a 12-hour clock (`format` and `hour12` force either part).
- `onchange({ value })` replaces a bubbled `change`; it fires for a whole valid date and time typed (or made invalid), a choice in the panel and the clear button. `oninput` stays native.
- `min` / `max` are `Date` instants: they limit the days, and the hours and minutes on their own day. `isDateDisabled(day)` turns days off, `minuteStep` sets the minutes column.
- The wrapper layout (`.container { display: flex }`, two widths) goes away: the field is one input, 100% wide (`--date-time-picker-text-field-*`).

The field types like the date and time fields (one mask: date, a space, the time; digits only with every separator added; A/P set AM/PM; `yyyy-MM-ddTHH:mm` can be pasted), opens the panel in a Menu on desktop and in a bottom Drawer up to 1024px. Choosing a day keeps the time (00:00 when there is none, moved inside `min` / `max`); choosing the minutes (or AM/PM) once there is a day closes the panel (`closeOnSelect`). [Filters](#filters) with `withTime` use it for their date-and-time values.

### Dialog

- `transition` → CSS variables `--dialog-transition-x`, `-y`, `-scale`. `'fly-up'`: `--dialog-transition-y="20px" --dialog-transition-scale="1"`; `'fly-down'`: `-y="-20px" -scale="1"`; `'scale'`: `-y="0px" -scale="0.7"`; `'fade'`: `-y="0px" -scale="1"`; `'fly-horizontal'`: `-x="-20px" -y="0px" -scale="1"` (it now leaves from the side it came from).
- `_overlayColor` + `_overlayOpacity` → `--dialog-backdrop-background` (v4 look: `rgb(40 40 40 / 30%)`); `_overlayBackdropFilter` → `--dialog-backdrop-filter` (v5 default blurs 8px: `none` for the v4 look); `_transitionDuration` → `--dialog-duration` (a time in `s` or `ms`); `_transitionTimingFunction` → `--dialog-easing`.
- `--dialog-transition-duration` → `--dialog-duration`, `--dialog-transition-timing-function` → `--dialog-easing` (v4 overwrote both inline from the props; app values now apply).
- `--dialog-overlay-opacity`, `--dialog-z-index` and `data-dialog` are gone.
- **`children` sits inside a styled surface** (card background, border, radius, shadow, 20px padding, max width 440px) with a scrolling body. An app that drew its own card gets a double card: `--dialog-padding="0" --dialog-background="transparent" --dialog-border-width="0" --dialog-box-shadow="none" --dialog-width="auto" --dialog-max-width="none"` for the v4 behaviour.
- `persistent` now also blocks Escape (v4 blocked only the backdrop click).
- `topRightSnippet`, `centerLeftSnippet`, `centerRightSnippet` sit 16px (`--dialog-inset`) from the screen edges, and every snippet receives `{ close }`.
- Opening moves the focus inside (first focusable element, or `autofocus`), Tab stays inside, and the focus returns on close.
- See also [Overlays](#overlays): unmounted when closed, inert page, events bubbling, no z-index.

New, optional: `title`, `titleSnippet`, `closable`, `closeLabel`, `closeSnippet`, `locale` (language of the texts), `actionsSnippet`, `onclose(event)`, `bind:dialogElement`, `class` object, `<form method="dialog">` support, about 37 `--dialog-*` variables.

### Divider

- It is a native `<hr>` with class `aurora-divider` (v4: an empty `<div>`); screen readers announce it as a separator. App CSS that targeted the v4 `div` must target `.aurora-divider` or use `class`.
- **Margins**: 10px above and below as in v4, but **no 5px on the sides**: the line spans the whole container. Set `--divider-margin-left` / `--divider-margin-right` where the inset mattered.
- Look: 1px `--global-color-border-strong` (v4: `background-500`), round ends (`--global-radius-full`, v4: 0.5px).
- Most apps use their own copy, `$lib/components/common/Divider.svelte` (props `color`, `weight`, `marginTop`, ...): it is app code and keeps working. To switch to the library, turn the props into the variables below.

| v4 | v5 |
|---|---|
| `--divider-color`, `-weight`, `-radius`, `-margin-top`, `-margin-bottom`, `-margin-left`, `-margin-right` | same names (`--divider-color` takes a gradient too) |
| `--divider-default-margin-top`, `-margin-bottom` | `--divider-default-spacing` |
| `--divider-default-margin-left`, `-margin-right` | removed (no side margin) |

New, optional: `variant` (solid \| gradient), `orientation` (horizontal \| vertical), `label` and `children` (text in the middle of the line), `bind:dividerElement`, `class` and native attributes, `data-variant`, `data-orientation`, `--divider-spacing`, `--divider-vertical-min-height`, `--divider-gap`, `--divider-label-*`.

### Drawer

- `closeOnClickOutside` (default `true`) → `persistent` (default `false`), inverted: `closeOnClickOutside={false}` → `persistent`. It now also blocks Escape.
- `overlay` removed: the drawer is always modal; for an invisible backdrop `--drawer-backdrop-background="transparent" --drawer-backdrop-filter="none"`.
- `items` and `onitemClick` removed (no fallback Navigator): put the navigation in `children`.
- `teleportedUid` removed. `position` is no longer bindable.
- `onclose()` → `onclose(event)`; it also fires for the X, `close` from snippets and `<form method="dialog">`.
- `children` sits in a scrolling body inside a panel with padding, inner border and shadow: `--drawer-padding="0" --drawer-border-width="0" --drawer-box-shadow="none"` for the v4 look.
- v4 was not modal and did not lock the scroll; v5 makes the page inert and locks it.

| v4 | v5 |
|---|---|
| `_space`, `--drawer-space` | `--drawer-size` (default 20rem; capped by `--drawer-max-size`) |
| `_openingSpeed`, `--drawer-opening-speed` | `--drawer-duration` (+ `--drawer-easing`) |
| `_backgroundColor`, `--drawer-background-color` (also the v4 global default) | `--drawer-background` |
| `_color`, `_borderRadius`, `_margin`, `_overflow` | `--drawer-color`, `--drawer-border-radius`, `--drawer-margin`, `--drawer-overflow` (now on the body) |
| `_overlayBackgroundColor`, `--drawer-overlay-background-color` | `--drawer-backdrop-background` (v4 look: `rgb(38 38 38 / 50%)`) |
| `_overlayOpacity`, `_overlaySpeed`, `--drawer-overlay-opacity`, `--drawer-overlay-speed`, `--drawer-z-index` | removed |

Defaults: `--drawer-default-space` → `--drawer-default-size`, `--drawer-default-opening-speed` → `--drawer-default-duration`, `--drawer-default-overlay-background-color` → `--drawer-default-backdrop-background`, `--drawer-default-background-color` (read by v4, never declared) → `--drawer-default-background`; `--drawer-default-overlay-speed`, `-overlay-opacity` and `-z-index` removed.

New, optional: `title`, `titleSnippet`, `closable`, `closeLabel`, `closeSnippet`, `locale` (language of the texts), `actionsSnippet` (fixed footer), `bind:drawerElement`, `class` object, `data-position`.

### Dropdown

- `menuOpened` → `open`; `menuAnchor` → `placement` (default `bottom-start`, so a menu wider than the button is left-aligned).
- `lang` → `locale`: the texts follow it (`placeholder` "Select" / "Seleziona", the selection "N selected" / "N selezionati", `clearLabel`, `closeLabel`, `noResultsText`), or follow `setDefaultLocale` without it ([Language of the texts](#language-of-the-texts)). v4 showed "N Selezionati" in every language and "Select" without `lang`: with `setDefaultLocale('it')` a Dropdown without `locale` is Italian. Text props and `selectionText` win.
- `searchText`, `maxVisibleChips` (no effect in v4) and `openingId` removed.
- `width`, `minWidth` → `--dropdown-width` (default `fit-content`), `--dropdown-min-width`, `--dropdown-max-width`; `height` → `size` or `--button-height`; `menuWidth` → the list matches the button, at least `--dropdown-menu-min-width` (220px).
- `values` defaults to `undefined` (v4: `[]`). `icon`: SVG path.
- `onchange` loses `detail` (see [Autocomplete](#autocomplete)).
- **`labelSnippet` changed meaning**: v4 replaced the whole button content; v5 `labelSnippet({ label })` renders the prefix label. For the selection text use `valueSnippet({ values, text, placeholder })`; `iconSnippet`, `chevronSnippet` and `clearSnippet` replace the other parts. `handleCloseClick` is gone: clear with `values = []`.
- `disabled` is native and hides the clear button (in v4 the list still opened and the X still cleared).
- Clicking the button opens **and closes** the list; Backspace never removes values; the chevron hides only while the clear button shows.
- The trigger is a `Button` (`variant="secondary"`, `size="md"` by default): pass `--button-*` to the Dropdown.

| v4 | v5 |
|---|---|
| `--dropdown-button-padding`, `-color`, `-border-radius`, `-height` | `--button-padding`, `--button-color`, `--button-border-radius`, `--button-height` |
| `--dropdown-button-background-color` | `--button-background` |
| `--dropdown-button-border` | `--button-border-width` + `--button-border-color` |
| `--dropdown-button-hover-color` | `--button-hover-background` and `--button-hover-color` |
| `--dropdown-button-focus-color`, `-focus-box-shadow` | `--button-focus-ring-*` |
| `--dropdown-button-active-color`, `-active-box-shadow`, `-box-sizing` | removed |

New, optional: `label` (prefix inside the button), `name`, `closeOnSelect`, `variant`, `size`, `selectionText`, `clearLabel`, `closeLabel`, `noResultsText`, `bind:buttonElement`, `class` object, snippets listed above, `--dropdown-*` variables.

### FilterEditor

The card that edits **one condition**. Filters shows it under a pill and after "Add filter"; it can be used alone.

- `filter` (definition and state) → `field` (a `FilterField`, converted as in [Filters](#filters)) + `bind:condition` (a `FilterCondition`, e.g. `filterCondition(field.name, 'between', { from: 10 })`). `tmpFilter` is gone: `condition` is the working copy.
- `lang`, `betweenFromLabel`, `betweenToLabel`, `labelsMapper` → `locale` and `labels` (`from`, `to`, `operators`); `lang="it"` → `locale="it"`, which picks every Italian text, or nothing with `setDefaultLocale('it')` in the root layout.
- `forceApplyValid` removed: Apply and Enter work when the condition is complete (`isConditionComplete`, or the field's `isComplete`). `editFilterMode` (a 5% margin) and `mobile` removed.
- `onchange({ detail: { filter, tmpFilter } })` → `onchange(condition)`, called at every change only without `confirm`. With `confirm` the card shows Cancel and Apply: `onapply(condition)`, `oncancel()`. `removable` adds Remove (`onremove()`), `onclose` a close button.
- `onclick`, `onkeypress` (on the v4 mode selector) removed.
- `customSnippet({ filter })` → `inputSnippet({ field, operator, value, setValue })`; call `setValue` instead of changing `filter.value`, and put the validity rule in `isComplete` on the field.
- `filterActionsSnippet({ applyFilterDisabled, filter })` removed: the card draws its own actions (see above).
- Look: title with the field icon, operators side by side (a select above four), then the input of the value; v4 had a Dropdown for the mode. The card has no background of its own: alone, wrap it in a surface. Width `--filter-editor-width` (320px).
- Operators: a v4 `advanced` filter offers the `standard` set of its type; `operatorSet` and `typeOperators` work as on Filters ([operator sets](#filters-operator-sets)), and a fixed mode is `operators: ['<operator>']` on the field. An operator the field accepts but does not offer is shown as chosen.
- Inputs have placeholders (`labels.value`, `labels.choose`, `labels.search`, `labels.amount`, or the field `placeholder`; v4 used the filter label). Options picked in the Autocomplete show two chips and "+N", as the v4 `maxVisibleChips={2}`; lists of texts or numbers show three chips and a "+N" button ("Show less" to collapse); `view: 'toggle'` becomes an Autocomplete when its labels do not fit.
- The v4 docs listed `--filters-button-cancel-*` and `--filters-wrapper-width` for FilterEditor, but it never read them: drop them.

New, optional: `confirm`, `removable`, `autofocus`, `class`, `operatorSet`, `typeOperators`, `onapply`, `oncancel`, `onremove`, `onclose`, inputs for every v5 operator (lists of texts or numbers as chips, amount + unit for relative dates, date and time, a column of `compareWith`, text with suggestions), `data-type`, `--filter-editor-*` variables.

### Filters

Redesigned: instead of showing every filter, the user **adds the conditions one at a time** ("+ Add filter" → field list → a card with operator and value). Each condition is a pill "field · operator · value" (click to edit, × to remove); the "Filters" button shows the count and opens a panel with every condition in rows. The API follows: v4 `filters: Filter[]` held definition and state together; v5 takes **`fields`** (definitions, usually constant) and **`value`** (the applied conditions, a JSON tree).

```svelte
<!-- v4 -->
<Filters bind:filters lang="it" onapplyFilter={reload} onremoveFilter={reload} onremoveAllFilters={reload} />

<!-- v5 -->
<Filters {fields} bind:value onchange={({ builder }) => reload(builder)} />
<!-- with setDefaultLocale('it') in the root layout, or locale="it" -->
```

**Definitions: `Filter` → `FilterField`**

| v4 `Filter` | v5 |
|---|---|
| `name`, `label`, `type`, `column` | the same on the field (`column` defaults to `name`) |
| `icon` (MDI class), `iconColor` | `icon` (SVG path); `iconColor` removed |
| `tabName` (+ `multiEditTabs`) | `category`: the tab label, a heading in the field list |
| `advanced: false` + `mode` (fixed mode) | `operators: ['<operator>']` (no operator choice in the card) |
| `advanced: true` + `mode` (the user picks the mode) | no `operators` (the [operator set](#filters-operator-sets) of Filters, `standard` by default), a list or a set name (`operators: 'basic'`); `defaultOperator: '<operator>'` |
| `active` + `value` / `values` / `from` / `to` | a condition in `value` |
| `value` / `values` / `from` / `to` without `active` (prefilled the editor) | `defaultValue` (the value of a new condition, in the v5 shape) |
| select `items` (`{ value, label, icon }`), `view` | the same (`icon` as SVG path); `view` also takes `'countries'` |
| bool `description` | `trueLabel` (the field `description` is the secondary text in the field list) |
| date `betweenModeSingleTextField` | removed: `between` always shows one range field |
| `modify` | a declarative option, else `apply` ([below](#filters-modify)) |
| `type: 'custom'` + `modify` + `customSnippet` | a declarative type, else `type: 'custom'` + `apply` + `inputSnippet` (+ `isComplete`) |
| `hidden`, `multiString`, `choice` | did nothing in v4; v5 `hidden` really hides the field |

**Modes → operators**

| Type | v4 `mode` | v5 operator | Notes |
|---|---|---|---|
| string | `equal` | `is` | |
| string | `contains` | `contains` | same JSON (`ilike '%v%'`), now with `%` and `_` escaped |
| string | `like`, `ilike` | `like`, `ilike` (same JSON), or better `contains` | v4 sent no `%`; appliers A–E add it, so they acted as "contains" ([backends](#filters-and-queries)) |
| number | `equal`, `greater`, `lower`, `between` | `eq`, `gt`, `lt`, `between` | same JSON, open ranges as before |
| date | `equal`, `between` | `is`, `between` | same JSON (whole local days) |
| date | `lower` | `before` | before the start of the day: same results |
| date | `greater` | `after`, or `onOrAfter` | `after` excludes the whole chosen day; v4 compared the raw midnight value, which `onOrAfter` matches on timestamps |
| select | `equal` | `in` | one value `where(column, '=', v)`, several `whereIn`, instead of a group of `orWhere` |
| select | `different` | `notIn` | one value `'<>'`, several `notWhereIn` |
| bool | `equal` | `isTrue` | v4 could not filter on false; `isFalse` is new |

Add `dateOnly: true` to fields on `date` columns: they compare `yyyy-MM-dd` strings.

<a id="filters-operator-sets"></a>**Operators per type: sets instead of `advanced`.** v4 `advanced: true` let the user pick among every mode of the type; v5 has **operator sets**. A field without `operators` offers the set chosen on Filters with `operatorSet`: `'basic'` (the essential ones), `'standard'` (default, `DEFAULT_OPERATORS`) or `'all'` (every built-in operator of the type). `typeOperators` gives a type its own list (`typeOperators={{ date: ['is', 'between', 'period'] }}`), and a field's `operators` wins over both: a list (one operator = the v4 fixed mode) or a set name (`operators: 'all'`). The options of a field add their operators to any set. FilterEditor alone takes the same `operatorSet` and `typeOperators`. A condition whose operator the field accepts but does not offer (from a preset, the URL, a saved filter, `defaultOperator` or code) still works: it is complete, it reaches the query, its pill reads normally and the card and the panel show its operator among the others. Where the backend cannot replay some operators ([kinds](#filters-and-queries)), leave them out of the set: on E / E' backends `operatorSet="basic"` (no `empty` / `notEmpty`) or `typeOperators`.

| Type | `basic` | `standard` (default) adds | `all` adds | With an option, or when listed |
|---|---|---|---|---|
| string | `contains`, `is` | `isNot`, `notContains`, `empty`, `notEmpty` | `startsWith`, `endsWith`, `anyOf`, `noneOf` | `match` (first, with `suggest`); `like`, `ilike` (v4 JSON) |
| number | `eq`, `between` | `ne`, `gt`, `gte`, `lt`, `lte`, `empty`, `notEmpty` | `notBetween`, `anyOf`, `noneOf` | `columnEq`, `columnNe`, `columnGt`, `columnGte`, `columnLt`, `columnLte` (with `compareWith`, before `empty`) |
| date | `is`, `between`, `period` | `before`, `after`, `inLast`, `empty`, `notEmpty` | `isNot`, `onOrBefore`, `onOrAfter`, `notBetween`, `inNext`, `olderThan`, `laterThan` | the column operators (with `compareWith`) |
| select | `in` | `notIn`, `empty`, `notEmpty` | | `all` (with `through` or `array`, also on a JSON key; not in `basic`). On those fields `in` / `notIn` read "has any of" / "has none of" |
| bool | `isTrue`, `isFalse` | | | `empty`, `notEmpty` (with `nullable`, in every set) |
| custom | `custom` | | | definitions `{ name, label, input, apply? }` |

The v4 modes of an `advanced` filter (string `equal`, `like`, `ilike`, `contains`; number and date `equal`, `greater`, `lower`, `between`; select `equal`, `different`) are all in `standard` except `like` / `ilike`: keep `advanced` filters without `operators`, or list exactly the v4 ones (`operators: ['is', 'contains']`). Operators outside `standard` that a rule below suggests (`startsWith`, `endsWith`, `anyOf`, `noneOf`, `notBetween`, `onOrBefore`, `onOrAfter`, `inNext`, `olderThan`, `laterThan`) are offered only when listed in the field `operators` or with `operatorSet="all"`.

- Text: `startsWith` / `endsWith` are Postgres regex matches (`~*`); `anyOf` / `noneOf` take a list of values typed as chips. **Every text operator ignores case by default**, `is` / `isNot` / `anyOf` / `noneOf` included: they send an anchored regex (`~* '^value$'`, `!~* '^(a|b)$'`) because an exact `ilike` would get `%` from the backends. v4 sent `=` (case-sensitive): `caseSensitive: true` keeps `=` / `<>` / `whereIn` / `notWhereIn` (and the column index) and makes `contains`, `notContains`, `startsWith`, `endsWith` and `match` tell case apart too. JSON keys without `cast` compare with `whereJsonSuperset`, always case-sensitive.
- Empty values and negatives: SQL leaves the empty (null) rows out of every comparison, so "surname is not Rossi" does not show the clients without a surname. `negativesIncludeEmpty` (on `Filters`, `filtersToBuilder` options or a field, the field wins) turns `isNot`, `notContains`, `ne`, `notIn`, `noneOf` and `notBetween` into "empty or …". **On by default**: it sends `kind: "null"`, which backends E and E' (lupette, likable-tools, epass, new-vigipass) do not replay (500), so those apps pass `negativesIncludeEmpty={false}` until their backend knows `null`.
- Number: `notBetween` is "< from or > to"; `anyOf` / `noneOf` like text (multiplied by `scale`).
- Date: `olderThan` is before the start of the day N units ago, `laterThan` after the end of the day N units ahead, `inLast` / `inNext` the whole days from N units ago to today (from today to N units ahead). Their value is `{ amount, unit }` (`FilterRelative`; units `days`, `weeks`, `months`, `years`, plus `minutes` and `hours` with `withTime`, measured from now); a plain number counts as days. `period` also offers `nextQuarter`, `nextYear`, `monthToDate`, `quarterToDate`, `yearToDate`.
- Column operators compare with another column of the same row, picked among `compareWith: [{ column, label }]`: `whereColumn(column, '<', other)`.
- A `json` field without `cast` keeps only the equalities of its set (`is`, `isNot`, `eq`, `ne`, `anyOf`, `noneOf`, `in`, `notIn`, `all`, `isTrue`, `isFalse`); a condition with another operator on it (from a preset or the URL) is incomplete and never reaches the query.

**New field options**

| Option | Fields | What it does |
|---|---|---|
| `json: { column, key, cast? }` | all | the value is a key of a JSONB column (`key: 'stats.visits'` for nested ones; `column` of the field is not used). Without `cast`: equalities with `whereJsonSuperset`. With `cast` (`'text'`, `'numeric'`, `'date'`, `'timestamp'`, `'boolean'`): every operator, as a parametrized `whereRaw('(??#>>?)::cast ...')`, accepted only by B backends ([JSON keys](#filters-and-queries)) |
| `caseSensitive` | string | `like` / `~` instead of `ilike` / `~*`, and `=` / `<>` / `in` for the equalities (v4 behaviour; default: they ignore case) |
| `negativesIncludeEmpty` | any | negative operators also keep the empty rows (default `true`; needs `kind: "null"` on the backend) |
| `suggest`, `suggestColumn` | string | suggestions while typing for `match`: a picked suggestion filters `suggestColumn` (default `column`) with `=`, typed text with `contains` |
| `compareWith: [{ column, label }]` | number, date | adds the column operators |
| `withTime` | date | values with a time, `'yyyy-MM-ddTHH:mm'`: `before`, `after`, `onOrBefore`, `onOrAfter`, `between`, `notBetween` compare instants (`is` / `isNot` stay whole days), relative dates also in minutes and hours |
| `array` | select | the column is a Postgres array: `in` = contains any of (`&&`), `all` = contains all of (`@>`), `empty` = null or `{}` |
| `nullable` | bool | adds `empty` / `notEmpty` |

The docs playground (Filters page, last example) shows every type, operator and option with the query it builds and the URL parameter.

**State → `value`**

```ts
let value = $state(
  createFilters([
    filterCondition('name', 'contains', 'rossi'),
    filterCondition('total', 'between', { from: 10, to: 100 }),
    filterCondition('createdAt', 'between', { from: '2026-01-01', to: toISODate(new Date()) }),
    filterCondition('status', 'in', [{ value: 'open', label: 'Open' }]),
    filterCondition('paid', 'isTrue')
  ])
);
```

Dates are `yyyy-MM-dd` strings, selects `{ value, label }` arrays (the label is what the pill shows). Values of the operators v4 did not have: `anyOf` / `noneOf` an array of strings or numbers, `notBetween` `{ from, to }`, relative dates `{ amount: 30, unit: 'days' }` (or `30`), `period` its name (`'thisMonth'`), `withTime` fields `'2026-10-09T14:30'`, column operators the `column` of a `compareWith` entry, `match` the typed text or the `{ value, label }` of a picked suggestion. A v4 definition with a value but without `active` only prefilled the editor: move the value to `defaultValue` on the field. `{ locked: true }` makes a condition the user cannot change or remove; on a `hidden` field it is an invisible constraint. Without `bind:value` Filters keeps its own state; passing `value={createFilters()}` clears it. App code that changed the array by hand works on the tree with helpers that return a new tree: `clearFilters(value)` (keeps `locked`), `removeFieldConditions(value, 'name')`, `addFilterNode(value, filterCondition(...))`, `filterConditions(value)`.

<a id="filters-modify"></a>**`modify` and custom filters**

`modify({ builder, value, values, mode })` is gone. What apps used it for is declared on the field:

| v4 `modify` or custom filter | v5 field |
|---|---|
| joins to reach the column, qualified column | `joins: [{ table, on: [from, to] }]` (left, added once) + `column: 'table.column'` |
| `whereIn(key, (q) => q.select(x).from(bridge)...)` | `through: { key, from: bridge, select: x, joins?, where? }` (an array for several hops) |
| OR over several columns, also word by word | string `columns: [...]`, `words: true` (`contains` / `is` word by word, `is` on whole words ignoring case; `notContains` / `isNot` are their exact opposites) |
| `%v%` or whole days added by hand | operators `contains`, `between` (`notBetween` for the opposite) |
| `v%`, `%v`, a case-sensitive `like` | `startsWith`, `endsWith`, `caseSensitive: true` |
| `whereIn` on a list of codes or numbers typed by the user | string or number `anyOf` / `noneOf` |
| `whereNull` (or `= ''`), FK null, "not exists" | operator `empty` (strings: `blankIsEmpty`, on by default; with `through`: `notWhereIn`; a bool that can be null: `nullable`) |
| entity picker with remote search, "assigned to me" | select with `searcher`, `shortcuts: [{ value: me.id, label: 'Me' }]` |
| static list of entities | select with `items` |
| "pick a suggestion (exact match) or keep the typed text" (addibox `CompanyFilter`, `WarehouseProductFilter`) | string `suggest` + `suggestColumn`, operator `match` |
| tags with AND / OR | select with `through`, operators `all` / `in` |
| Postgres array column (`&&`, `@>` in a `whereRaw`) | select `array: true` |
| comparison with another column (`whereColumn('quantity', '<', 'minQuantity')`) | number or date `compareWith` (the user picks `columnLt`, ...), or as a fixed yes / no: bool `whenTrue` / `whenFalse` with the `whereColumn` |
| bool that means another condition ("only mine", a value from app state) | `whenTrue` / `whenFalse` (run at every query build: `$state` read there is tracked and re-emits `onchange`) |
| "hide archived" until the user asks | `whenAbsent` |
| fixed hidden constraint | `hidden: true` field + `locked` condition |
| units (tons on a kg column) | number `unit`, `scale` |
| one option that stands for several values | item `values: [...]` |
| relative dates ("last 30 days", "older than a year", "next 2 weeks") | date `inLast`, `olderThan`, `inNext`, `laterThan` with `{ amount, unit }`, `period` |
| "valid now" (`validFrom <= now <= validTo`) | bool `whenTrue: (b) => b.where('validFrom', '<=', new Date()).where('validTo', '>=', new Date())`, or `onOrBefore` / `onOrAfter` conditions with `toISODate(new Date())` (fixed when built, e.g. in a preset) |
| date and time inputs | date `withTime: true` |
| JSONB key, `whereJsonSuperset(column, { key: v })` | `json: { column, key }` |
| JSONB key with a cast (`(col->>'key')::numeric > ?` in a `whereRaw`) | `json: { column, key, cast: 'numeric' }` (B backends only, [JSON keys](#filters-and-queries)) |
| state kept in stores, `sessionStorage`, the URL | `serializeFilters` / `parseFilters`, `filtersToParam` / `filtersFromParam` ([saved state](#filters-and-queries)) |
| saved views built by the app (v4 had none) | `savable`, `savedKey` or `bind:saved` ([saved filters](#filters-saved)) |
| anything else | `apply(builder, condition)` on the field, or operators `{ name, label, input, apply? }` |

In `apply`, `condition.value` replaces `value` / `values` / `{ from, to }` and `condition.operator` replaces `mode`; dates are `yyyy-MM-dd` strings (`parseISODate`), selects `FilterItem[]`. Mutate the builder: a returned builder is ignored (`return builder.where(...)` still works, a new builder does not). Joins go before the conditions and `orderBy` / `select` / `from` after them, so a `modify` that sorted keeps working; a query that mixes `where` and `orWhere` is wrapped in a group, so no OR reaches the first level. An operator definition without `apply` uses the field's.

A filter that stays custom is `type: 'custom'` + `apply` (the v4 `modify` body) + the Filters `inputSnippet`, one for all custom fields. Without `operators` the field gets the built-in operator `custom` (no operator text in the pill and the card); list `{ name, label, input: 'custom' }` definitions for several (`is` / `is not`) and read `condition.operator` in `apply`.

```ts
{
  name: 'color', label: 'Color', type: 'custom',
  apply: (builder, condition) => { builder.where('products.color', '=', condition.value as string); },
  isComplete: (condition) => typeof condition.value === 'string' && /^#[0-9a-f]{6}$/i.test(condition.value),
  format: (condition) => String(condition.value).toUpperCase()
}
```

```svelte
{#snippet inputSnippet({ field, value, setValue })}
  {#if field.name === 'color'}
    <ColorPicker {value} onchange={(color) => setValue(color)} />
  {/if}
{/snippet}
```

`updateFunction(name, value, valid)` → `setValue(value)`, with the rule that computed `valid` in `isComplete` (or `setValue(valid ? value : undefined)`). Without `isComplete` a custom value is complete when it is not `undefined`, `null`, `''`, an empty array or an empty object. The pill shows text and numbers as they are, arrays joined by ", " (items by label) and nothing for objects: give the field `format` otherwise. Drop the code that reset custom inputs on remove: the input reads `value`.

<a id="filters-saved"></a>**Saved filters and URL.** v4 had no saved filters. `savable` adds a "Saved filters" button: the user saves the current complete conditions under a name, applies a saved set (it replaces the current conditions) or deletes it. `savedKey="orders-filters"` keeps them in `localStorage`; `bind:saved` (or `saved` + `onsavedchange(list)`) gives the app the `SavedFilter[]` (`{ id, name, value }`) to keep in the backend; `saved` or `savedKey` turn the button on without `savable`. For links and reloads, `filtersToParam(value)` writes the tree as a short JSON string and `filtersFromParam(text, fields)` reads it back (also what `serializeFilters` wrote), with unknown fields dropped and an empty tree for missing or invalid input:

```ts
// +page.ts
export const load = ({ url }) => ({ value: filtersFromParam(url.searchParams.get('filters'), fields) });
```

```svelte
<Filters {fields} bind:value savable savedKey="orders-filters"
  onchange={({ value, builder }) => {
    replaceState(`?filters=${encodeURIComponent(filtersToParam(value))}`, {});
    reload(builder);
  }} />
```

(`replaceState` from `$app/navigation`.) Both carry `locked` conditions: keep tenant and permission constraints in the `builder` prop or in the backend.

**Props**

| v4 | v5 |
|---|---|
| `filters` (bindable) | `fields` + `value` (bindable) |
| `showActiveFilters` | `showPills` |
| `dateLocale`, `lang` | `locale` (BCP 47): language of every text and format of dates and numbers (`lang="it"` → `locale="it"`, or nothing with `setDefaultLocale('it')`); single texts in `labels` |
| `addFilterLabel`, `filterTitleLabel` | `labels.filters` ("+ Add filter" is `labels.addFilter`) |
| `cancelFilterLabel`, `applyFilterLabel` | `labels.cancel`, `labels.apply` (only with `confirm`) |
| `trueString`, `falseString` | `labels.yes`, `labels.no`, or `trueLabel` / `falseLabel` per field |
| `labelsMapper` | `labels.operators`, keyed by v5 operator (one string, not `short` / `extended`) |
| `betweenSeparator` | removed: ranges read "start – end" |
| `editFilterMode` | removed: one UI (a card for one condition, the panel for all) |
| `multiEditTabs` | `category` on the fields |
| `drawerSpace` | removed: the bottom sheet fits its content (max 90dvh); `--drawer-size` on Filters forces a height |
| `onclick`, `onkeydown` | removed |

**Behaviour**

- **Changes apply as soon as a condition is complete**, 300 ms after the last edit (`applyDelay`); v4 waited for Apply. `confirm` brings Cancel and Apply back in the card and the panel.
- **AND only by default**, as v4. `allowOr` and `maxDepth` enable OR and nested groups in the panel: check the backend first ([Filters and queries](#filters-and-queries)).
- **Groups**: with `maxDepth` every filter of the panel is a box with its own "Add nested filter" (`labels.addNestedFilter`), and the root has one "Add filter". "Add nested filter" on a single filter turns it into a group with that filter and a new empty row (OR under an AND group when `allowOr` is on, AND otherwise); on a group it adds a row. Below `maxDepth` the filters inside a group are boxes too; at the last level they are plain rows. A group with two or more rows also has "Clear group"; a group left with one filter becomes that filter (also in `pruneFilters`), so there is never a box with a single box inside. Rows only have the remove button; there is no "Add group" button. In the bar, a group with one complete condition shows that condition's pill.
- **Inputs**: every value input has a placeholder (`labels.value`, `labels.choose` for options, `labels.search` for `searcher` and `suggest`, `labels.amount` for relative dates; the field `placeholder` wins), where v4 used the filter label in one-edit. Options picked in an Autocomplete show two chips and a "+N" counter (`maxVisibleChips` 2, as the v4 FilterEditor; 1 in the panel rows); lists of texts or numbers show three chips (two in the rows) and a "+N" button that shows them all until "Show less" (`labels.showLess`). The hidden values of every "+N" are listed in a Tooltip (v4: none). Opening the card of a filter that already has a value does not open its list or calendar: the focus goes to the operator (or to a text field); a new filter still opens them right away. In the panel rows dates show their format as placeholder instead of the format chip, and `view: 'toggle'` becomes an Autocomplete when its labels do not fit.
- **Presets**: a chip is on while every condition of its preset is in the tree with the same field, operator and value, however it got there (by hand, URL, saved filters); editing one of them turns the chip off, and clicking an active chip removes exactly those conditions. A locked condition matches only a locked preset condition, so a chip never removes a constraint of the app.
- The same field can appear in several conditions.
- Up to 1024px everything opens in a bottom sheet (`mobileDrawer`); v4 used a drawer with a wizard.
- Texts follow `locale`, else `setDefaultLocale`, else English: `it` is Italian, `en` and any other language English (below).

**Callbacks**

- `onapplyFilter()` → `onchange({ value, builder })`, called for **every** change of the query, removals included. `builder` is the query (`filtersToBuilder(value, fields, { builder })` on top of the `builder` prop): drop the `FilterConverter` call from the handler. `value` holds only complete conditions.
- `onremoveFilter({ detail: { filter } })` and `onremoveAllFilters()` → `onremove({ conditions })`, with the complete conditions the user removed (× of a pill, Remove, a panel row, Clear, a preset turned off; all at once for Clear). When the v4 handler reloaded the data (often the same function as `onapplyFilter`), **delete it** instead of renaming, or every removal loads twice; when it reset a custom input, delete it too. Keep `onremove` for app state outside the filters; `e.detail.filter.name` → `e.conditions[i].field`.
- `onaddFilterClick()` → `onopen({ view, field })`: `view` is `'fields'` (the list after "+ Add filter"), `'editor'` (the card of `field`) or `'panel'` (also "+ Add filter" on mobile). For options loaded on demand prefer `searcher` on the field, or load them when `view === 'editor'` for that field.
- `onchange` does not fire on mount: build the first query with `filtersToBuilder(value, fields)`. It fires only when the query changes, also when the app changes `value` or the `builder` prop: remove manual reloads after a programmatic change.

**Snippets**

- `customSnippet({ filter, updateFunction, mAndDown })` → `inputSnippet({ field, operator, value, setValue })` (see above).
- `customChipSnippet({ filter })` → `pillSnippet({ condition, field, operator, value })`, which replaces the text of **every** pill; for custom values prefer `format` on the field.
- `appendSnippet` stays right after the filter buttons; page actions ("New", sync, export) go in the new `actionsSnippet`, at the end of the bar. `prependSnippet` is new (e.g. a search field).
- `contentSnippet` removed (DynamicFilters).

**CSS variables**

| v4 | v5 |
|---|---|
| `--filters-wrapper-width` (`auto`) | `--filters-width` (`100%`) |
| `--filters-card-padding`, `-card-title-font-size`, `-card-title-font-weight`, `-card-title-color`, `-card-title-margin-bottom` | `--filter-editor-padding`, `-title-font-size`, `-title-font-weight`, `-color` (whole card), `-gap`, set on Filters |
| `--filters-card-background-color`, `-card-border`, `-card-border-radius`, `-card-box-shadow` | `--menu-background`, `--menu-border-width` + `--menu-border-color`, `--menu-border-radius`, `--menu-box-shadow`, set on Filters (the card, field list and panel are Menus) |
| `--filters-one-edit-menu-max-height` | `--menu-max-height` |
| `--filters-button-height`, `-button-border-radius`, `-button-cancel-color`, `-button-cancel-background-color`, `-card-hover-box-shadow`, `-card-hover-transition` | removed |

`-default-*` names follow where there is a FilterEditor counterpart (`--filters-default-card-padding` → `--filter-editor-default-padding`); the Menu ones have none (set them on the instance). App CSS on `.filters-wrapper`, `.filter-button`, `.filter-slot`, `.chip-content` must use `.aurora-filters-*` classes or the `class` parts.

**Italian texts**: `setDefaultLocale('it')` in the root layout ([Language of the texts](#language-of-the-texts)) or, on a single Filters, v4 `lang="it"` → `locale="it"`, which picks every Italian text of the library (labels, operators, periods, the lists and the calendar inside) and formats dates and numbers. Single texts go on top: `labels={{ filters: 'Filtra' }}`. For a language the library does not have, pass every text in `labels` (`FILTER_LABELS_IT` and `DEFAULT_FILTER_LABELS` are exported as models). App wrappers around Filters set them once inside the wrapper.

**Example.** A typical v4 list (text `ilike`, select `equal` with an applied value, date and number `between`, bool, custom with a `whereIn` subquery):

```svelte
<script lang="ts">
  import { Filters, FilterConverter, Autocomplete } from '@likable-hair/svelte';

  let filters = $state([
    { name: 'name', label: 'Nome', type: 'string', column: 'customers.name', mode: 'ilike' },
    {
      name: 'status', label: 'Stato', type: 'select', column: 'orders.status', mode: 'equal',
      items: [{ value: 'open', label: 'Aperto' }, { value: 'closed', label: 'Chiuso' }],
      values: [{ value: 'open', label: 'Aperto' }], active: true
    },
    { name: 'createdAt', label: 'Creato', type: 'date', column: 'orders.createdAt', mode: 'between', tabName: 'dates' },
    { name: 'total', label: 'Totale', type: 'number', column: 'orders.total', mode: 'between', advanced: true },
    { name: 'paid', label: 'Pagato', type: 'bool', column: 'orders.paid', mode: 'equal', description: 'Solo pagati' },
    {
      name: 'tags', label: 'Tag', type: 'custom',
      modify: ({ builder, value }) =>
        builder.whereIn('orders.id', (q) =>
          q.select('orderId').from('order_tags').whereIn('tagId', value.map((t) => t.value)))
    }
  ]);

  function reload() {
    const builder = new FilterConverter().createBuilder({ filters });
    load(builder);
  }
</script>

<Filters bind:filters lang="it" multiEditTabs={[{ name: 'dates', label: 'Date' }]}
  onapplyFilter={reload} onremoveFilter={reload} onremoveAllFilters={reload}>
  {#snippet customSnippet({ filter, updateFunction })}
    {#if filter?.name === 'tags'}
      <Autocomplete multiple items={tagItems} values={filter.value ?? []}
        onchange={(e) => updateFunction('tags', e.detail.selection, e.detail.selection.length > 0)} />
    {/if}
  {/snippet}
</Filters>
```

becomes:

```svelte
<script lang="ts">
  import {
    Filters, createFilters, filterCondition, filtersToBuilder,
    type FilterBuilder, type FilterField
  } from '@likable-hair/svelte';

  const fields: FilterField[] = [
    { name: 'name', label: 'Nome', type: 'string', column: 'customers.name', operators: ['contains'] },
    {
      name: 'status', label: 'Stato', type: 'select', column: 'orders.status', operators: ['in'],
      items: [{ value: 'open', label: 'Aperto' }, { value: 'closed', label: 'Chiuso' }]
    },
    { name: 'createdAt', label: 'Creato', type: 'date', column: 'orders.createdAt', operators: ['between'], category: 'Date' },
    { name: 'total', label: 'Totale', type: 'number', column: 'orders.total', defaultOperator: 'between' },
    { name: 'paid', label: 'Pagato', type: 'bool', column: 'orders.paid', operators: ['isTrue'], trueLabel: 'Solo pagati' },
    {
      name: 'tags', label: 'Tag', type: 'select', column: 'tagId', operators: ['in'], items: tagItems,
      through: { key: 'orders.id', from: 'order_tags', select: 'orderId' }
    }
  ];

  let value = $state(createFilters([filterCondition('status', 'in', [{ value: 'open', label: 'Aperto' }])]));

  function load(builder: FilterBuilder) {
    fetch(`/api/orders?${new URLSearchParams({ filtersBuilder: builder.toQueryParam() })}`);
  }

  load(filtersToBuilder(value, fields));
</script>

<Filters {fields} bind:value locale="it" onchange={({ builder }) => load(builder)} />
```

The query is the same as v4 except the select, which now sends `where('orders.status', '=', 'open')` (v4: a group with one `where`; with two values a `whereIn`), and the name filter, which sends `%v%` (use `operators: ['ilike']` for the identical JSON). The `tags` field produces the v4 `whereIn` subquery (with one tag, `where('tagId', '=', 1)` inside it). `toQueryParam()` sends the whole query as one JSON string, which avoids the `qs` depth limit of GET; the backend needs the one-line change in [backends](#filters-and-queries). Without `through` the same filter is `apply: (builder, condition) => { builder.whereIn('orders.id', (q) => q.select('orderId').from('order_tags').whereIn('tagId', (condition.value as FilterItem[]).map((t) => t.value))); }`.

New, optional: field options (`columns`, `words`, `joins`, `through`, `json`, `apply`, `defaultValue`, `isComplete`, `whenAbsent`, `pinned`, `hidden`, `category`, `description`, `format`, `blankIsEmpty`, `caseSensitive`, `suggest`, `suggestColumn`, `unit`, `scale`, `step`, `compareWith`, `dateOnly`, `withTime`, `periods`, `searcher`, `shortcuts`, `array`, item `values`, `trueLabel`, `falseLabel`, `whenTrue`, `whenFalse`, `nullable`), new operators ([per type](#filters-operator-sets)), `operatorSet` and `typeOperators` (operator sets instead of v4 `advanced`), relative dates with units, `allowOr`, `maxDepth` (groups added with "Add nested filter"), `presets`, saved filters (`savable`, `saved`, `savedKey`, `onsavedchange`), `confirm`, `applyDelay`, `builder`, `weekStart`, `mobileDrawer`, `class` parts, `prependSnippet`, `actionsSnippet`, helpers (`filtersToParam`, `filtersFromParam`, `fieldOperators(field, { set, byType })`, `operatorOf`, `OPERATOR_SETS`, `FILTER_OPERATORS`, ...), new `labels` (`units`, `unit`, `addValue`, `addNestedFilter`, `choose`, `search`, `amount`, `showLess`, `loading`, `noResults`, `searchError`, `typeMore`, `invalidDate`, `chooseDate`, `previousMonth`, `nextMonth`, `previousYear`, `nextYear`, `dateLetters` (the texts of the lists and date fields inside, so `labels={FILTER_LABELS_IT}` translates everything), `time`, `compareWith`, `savedFilters`, `saveFilters`, `saveAs`, `save`, `deleteSaved`, `noSaved`), `data-count`, `data-open`, `--filters-*` variables.

### FlagIcon

- **Flags are 4:3 by default**; add `square` for the v4 look (the width changes from 1em to 1.33em).
- `--flag-icon-default-size`: `1.2rem` → `1.2em` (it follows the surrounding font size). `--flag-icon-default-border-radius`: 4px → 3px. A 1px ring is drawn around every flag (`--flag-icon-box-shadow`).
- Without `title` the flag is hidden from screen readers.
- Class `flag-icon` → `aurora-flag-icon`; `fis` only with `square`.
- Flags come from the `flag-icons` npm package. The v4 aliases still work (`uk`, `el`, `xs`, `xi`, `ac`, `ta`). With Vite the smaller flags are inlined in the CSS (about 320 KB); to download each flag only when shown: `build: { assetsInlineLimit: (file) => (file.includes('/flag-icons/') ? false : undefined) }`.

`--flag-icon-font-size`, listed in the v4 docs, had no effect: delete it (the size is `--flag-icon-size`).

New, optional: `square`, `title`, `--flag-icon-box-shadow`.

### HorizontalStackedProgress

- Look: one 12px bar of separate segments with rounded corners and a 3px gap, a hover highlight, and the legend in a row below (v4: one 5px `ProgressBar` per segment with a 4px gap, labels under the segments, no legend).
- **Defaults changed**: labels under the segments are off and the legend is on (v4: the opposite). For the v4 look pass `segmentLabels legend={false}`.
- Default colors come from the data palette `--global-color-data-1…6` (v4: shades of primary). An entry's `color` is any CSS color, as before.
- `progresses` and the `ProgressItem` type unchanged (`ProgressItem` is now exported).
- New `total`: the segments take `value / total` of the bar and the rest stays empty. Without it they fill the bar, as in v4.
- The tooltip of a segment now shows `label: value` (v4: the value only), on the v5 `Tooltip`.
- Screen readers read the legend as a list; with `legend={false}` it stays in the page, visually hidden. The root is a `role="group"` named by `label`.

| v4 | v5 |
|---|---|
| `labelVisible` (default `true`) | `segmentLabels` (default `false`) |
| `labelTextVisible`, `labelValueVisible` | `segmentLabelSnippet({ item, percentage })` |
| `legendVisible` (default `false`) | `legend` (default `true`) |
| `legendTextVisible`, `legendValueVisible` | `legendItemSnippet({ item, percentage })` |
| `hideLabelUnderPercentage` | `minLabelPercentage` |
| `tooltipVisible` | `valueTooltip` |
| `--progress-bar-height` passed to it | `--horizontal-stacked-progress-height` |
| `--horizontal-stacked-progress-dot-height`, `-dot-width`, `-dot-min-width` | `--horizontal-stacked-progress-dot-size` |
| `--horizontal-stacked-progress-label-gap` | `--horizontal-stacked-progress-segment-label-gap` |
| `--horizontal-stacked-progress-label-font-size`, `-label-font-weight` (text under a segment) | `--horizontal-stacked-progress-segment-label-font-size`, `-segment-label-font-weight`. The `-label-*` names now style the header label |
| `--horizontal-stacked-progress-value-font-size` (value under a segment and in the legend) | `--horizontal-stacked-progress-segment-value-font-size` (the legend follows `-legend-font-size`). The `-value-font-size` name now styles the header value |
| `--horizontal-stacked-progress-value-font-weight` | `--horizontal-stacked-progress-segment-value-font-weight` and `-legend-value-font-weight` |

Unchanged: `--horizontal-stacked-progress-width`, `-gap`, `-legend-margin-top`.

New, optional: `total`, `label`, `labelSnippet`, `showValue`, `valueSnippet`, `class` and native attributes, `--horizontal-stacked-progress-rest-background`, `-segment-border-radius`, `-hover-*`, `-legend-*`, `-dot-border-radius`.

### Icon

- `name` (MDI class) → `path` (SVG path, e.g. `mdiCake` from `@mdi/js`). MDI helper classes (`mdi-spin`, `mdi-rotate-*`, `mdi-18px`) do nothing.
- **Not clickable**: `onclick` and `tabindex` are removed. A clickable icon is `<Button buttonType="text" icon={mdiX} aria-label="..." onclick={...} />`.
- It renders an `<svg class="aurora-icon">` (decorative unless `title` is set) instead of `<span role="button" class="icon mdi ...">`. As in v4, it takes only its props (`path`, `title`, `class`): no `id`, `style` or other attributes.

| v4 | v5 |
|---|---|
| `--icon-size` | same; now width and height of the `<svg>` (default `1em`) |
| `--icon-color` | same; now `fill` (default `currentColor`) |
| `--icon-hover-color`, `--icon-active-color`, `--icon-cursor`, `--icon-pointer-events`, `--icon-container-height`, `--icon-container-width` | removed: style the Button |
| `--icon-height`, `--icon-width` (listed in the v4 docs) | removed: they had no effect in v4, delete them |

New, optional: `title`.

### LinkButton

- **Different look**: v4 drew a grey pill (a link that looks like a button); v5 is an inline text link with an animated underline. For the v4 look use `<Button href="..." variant="secondary">`.
- `disabled` now really disables the link (no `href`, `aria-disabled`, `onclick` not called); in v4 it only skipped the callbacks and the link still navigated.
- `onclick({ detail: { nativeEvent } })` → native `onclick(event)`, same for `onkeypress`. Every `<a>` attribute is passed through (`download`, `rel`, `aria-*`, ...).
- With `target="_blank"`, `rel` defaults to `noopener noreferrer` (v4: `noreferrer`).
- It is `inline-flex` (v4: `flex`, full row): it sits inside text.
- Icon props are SVG paths.

| v4 | v5 |
|---|---|
| `--link-button-background-color`, `-hover-background-color` | `--link-button-background`, `--link-button-hover-background` (default transparent) |
| `--link-button-width`, `-height` | removed (use `Button` with `href` for a sized link) |

Unchanged: `--link-button-color`, `-font-size`, `-font-weight`, `-line-height`, `-padding`, `-border-radius`, `-gap`.

New, optional: `rel`, `bind:linkElement`, `--link-button-hover-color`, `--link-button-underline-*`, `--link-button-icon-*`, focus ring and disabled variables, `data-disabled`.

### Menu

| v4 | v5 |
|---|---|
| `anchor` | `placement` |
| `_activatorGap` | `offset` (default 5 → 6) |
| `_width`, `_height`, `_maxHeight`, `_minWidth`, `_overflow`, `_boxShadow`, `_borderRadius` | `--menu-width`, `--menu-height`, `--menu-max-height`, `--menu-min-width`, `--menu-overflow`, `--menu-box-shadow`, `--menu-border-radius` |
| `_top`, `_left` | a virtual activator: `activator={{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }}` (viewport coordinates) |
| `_offsetTop`, `_offsetLeft` | `offset`, or a shifted virtual activator |
| `refreshPosition`, `flipOnOverflow`, `stayInViewport` | removed: the menu follows the activator, flips and stays in the viewport by itself |
| `inAnimation`, `outAnimation` (+ configs) | `--menu-duration`, `--menu-transition-distance`, `--menu-transition-scale` |
| `openingId` | removed: opening a menu closes the others, except nested ones and those with `closeOnClickOutside={false}` |
| `_width = activator.offsetWidth` | `matchActivatorWidth` |

`placement` values: `bottom` → `bottom-start`, `bottom-center` → `bottom`, `up` → `top-start`, `up-center` → `top`, `left` → `left-start`, `left-center` → `left`, `right` → `right-start`, `right-center` → `right`. Careful: `"bottom"`, `"left"` and `"right"` still type-check but now mean centered.

- `closeOnClickOutside` defaults to `true` (v4: `false`); Escape always closes the menu. Use `bind:open`, since the menu closes itself. With a menu open inside it (a submenu, the list of an Autocomplete or the calendar of a date field in a menu), a click outside or Escape closes only the innermost one, one level each.
- It is a `popover` on the top layer with `position: fixed`: never clipped by `overflow`, no z-index. A submenu must be rendered inside the parent menu's `children`, otherwise opening it closes the parent.
- It has a default surface (padding, background, border, radius, shadow, blur). Content that draws its own card: `--menu-padding="0" --menu-background="transparent" --menu-border-width="0" --menu-box-shadow="none" --menu-backdrop-filter="none"`.
- Nothing is rendered while closed (v4 kept a hidden element), and the element loses `role="presentation"`, `data-menu` and the inline z-index.

New, optional: `-start`/`-end` placements, `matchActivatorWidth`, virtual activator, `class` and native attributes, `data-side`.

### MonthSelector

- `onclick({ detail: { monthIndex } })` → `onchange({ month })`.
- `labelSnippet({ month, monthName })` → `itemSnippet({ month, label, name, selected, current, disabled })` (`monthName` → `name`). `selectorSnippet` removed (it could not choose a month): the cell keeps click and keyboard; style it with `--month-selector-*` or `class.month`.
- Names are short by default ("Gen"; v4 "Gennaio"): `monthFormat="long"` for full names. `locale` defaults to the one of `setDefaultLocale`, else `'en'` (v4: `'it'`), and takes any BCP 47 tag; it also gives the default accessible name of the grid ("Month", "Mese").
- `class.buttons` → `class.month`. The months are `role="option"` cells of a listbox (one Tab stop, arrows, Home/End, Enter/Space), not Buttons; the current month has a border, the selected one a primary fill.
- `--month-selector-height` defaults to `auto` (v4: `100%`); `--month-selector-width` unchanged. Markup: `.selector-container` → `.aurora-month-selector`, `.aurora-month-selector-month` with `[data-selected]`, `[data-current]`, `[data-disabled]`.

New, optional: `year`, `min`, `max`, `disabled`, `monthFormat`, `focus()`, `bind:monthSelectorElement`, native attributes, `data-*`, `--month-selector-*` for columns, gap, padding, colors and states.

### NoData

- Look: the default (`size="md"`) is a framed icon with dashed rings, a title in the display font and an optional description and actions. `size="sm"` is close to the v4 look (icon and text only), for tables, lists and cards.
- `noItemsText` → `title`; `iconName` (MDI class) → `icon` (SVG path, default `mdiDatabaseOffOutline`).
- `lang` → `locale`: the default title is "No data available", "Nessun dato disponibile" with `it`; without `locale` it follows `setDefaultLocale` ([Language of the texts](#language-of-the-texts)), so a v4 NoData without `lang` (English) becomes Italian in an app with `setDefaultLocale('it')`. `title` wins.
- `class` is now on the root (v4: on the text).
- Text is readable: v4 dimmed the whole block to 50% and the text again to 50% (25% in total).
- `--no-data-height` still sets the height (default `auto`, v4: 200px), but the space now comes from `--no-data-min-height` (200px, `sm`: 120px), which wins over a smaller height: for a v4 height below that, set `--no-data-min-height` too (the same value or `0`). The same goes for `--no-data-default-height` and `--no-data-default-min-height`.

Unchanged: `--no-data-gap`.

New, optional: `description`, `size`, `children` (actions), `titleSnippet`, `descriptionSnippet`, `iconSnippet`, native attributes, `data-size`, `--no-data-min-height`, `-padding`, `-max-width`, `-icon-*`, `-ring-color`, `-title-*`, `-description-*`, `-actions-gap`.

### Paginator

- `maxPage` → `pageCount` (same meaning). `bind:maxPage` → `pageCount={maxPage}`: the paginator never wrote it.
- `onchange({ detail: { page } })` → `onchange({ page })`: `e.detail.page` → `e.page`. It is no longer called for the page that is already current.
- **`page` is no longer clamped**: v4 moved it back to `maxPage` without calling `onchange` (the data did not reload). Now a page past `pageCount` stays, no number is marked and "previous" goes to the last page. Set `page = 1` when filters, search or page size change.
- Look of the prototype: `« ‹ 1 … 6 7 8 … 24 › »` (v4: previous, current and next page only), mono digits, filled current page, always the same number of buttons. First and previous are disabled on the first page, next and last on the last one (`aria-disabled`, they keep the focus). Without `pageCount` it works as in v4: "next" always enabled, no "last".
- It is a `<nav>` named "Pagination" with `aria-current="page"`; the texts follow `locale`. App CSS on `.paginator-container`, `.page-button` or `.selected` must target `.aurora-paginator`, `.aurora-paginator-button` and `[aria-current="page"]`.
- Six apps have a copy, `$lib/components/common/StandardPaginator.svelte`: replace it with the library one.

| v4 | v5 |
|---|---|
| `--paginator-page-button-background-color`, `-color`, `-padding`, `-border-radius` | `--paginator-button-background`, `-color`, `-padding`, `-border-radius` |
| `--paginator-page-button-hover-background-color` | `--paginator-button-hover-background` |
| `--paginator-page-button-selected-background-color`, `-selected-color` | `--paginator-current-background`, `--paginator-current-color` |
| `--paginator-page-button-hover-border-radius`, `-selected-padding` | removed (same radius and padding as the other buttons) |
| `--paginator-page-button-focus-color`, `-focus-background-color` | removed: focus ring, `--paginator-focus-ring-color` |

Defaults: the same renames on `--paginator-default-page-button-*` → `--paginator-default-button-*` and `--paginator-default-current-*`.

New, optional: `siblingCount`, `showFirstLast`, `compact` ("7 / 24"), `pageHref` (links, page in the URL), `pageSnippet`, `firstIcon` / `previousIcon` / `nextIcon` / `lastIcon`, `locale` and the `*Label` texts, `bind:paginatorElement`, `class` object (`container`, `button`, `current`), `data-compact`, `data-current`, `--paginator-gap`, `-font-*`, `-icon-size`, `-button-size`, `-button-hover-color`, `-current-box-shadow`, `-ellipsis-*`, `-status-*`, `-disabled-opacity`, `-focus-ring-*`, `-duration`, `-easing`.

### ProgressBar

- Look: an 8px pill track with the theme gradient, a glow and a moving shimmer (v4: 5px, radius 2px, flat primary). Pass `--progress-bar-height="5px"` for the v4 height.
- `value` and `total` unchanged; the fill and `aria-valuenow` are clamped to `0…total` (v4 relied on `max-width: 100%`), while `valueSnippet` and the tooltip still get the raw `value`.
- `valueTooltip` and `valueTooltipLabel` unchanged, now on the v5 `Tooltip`: it opens above the whole bar (v4: below the filled part) after 400 ms. While `valueTooltip` is set, `valueTooltipLabel` is also the `aria-valuetext` (an `aria-valuetext` passed by the app wins). A `valueTooltipLabel` of `0` or `''` is now shown as is (v4 fell back to `value`).
- It is a `role="progressbar"` with `aria-valuenow` (v4 had no role): give it a `label` or an `aria-label`.

| v4 | v5 |
|---|---|
| `--progress-bar-background-color` | `--progress-bar-background` |
| `--progress-bar-highlight-color` | `--progress-bar-fill-background` (any color or gradient) |
| `--progress-bar-tooltip-background-color`, `-tooltip-border-radius`, `-tooltip-padding` | `--tooltip-background`, `--tooltip-border-radius`, `--tooltip-padding` passed to the ProgressBar |

Unchanged: `--progress-bar-height`, `-width`, `-border-radius`. Defaults follow the same renames.

New, optional: `label`, `labelSnippet`, `showValue`, `valueSnippet`, `indeterminate`, `variant`, `class` and native attributes, `data-variant`, `data-indeterminate`, `--progress-bar-gap`, `-fill-box-shadow`, `-shimmer-*`, `-indeterminate-*`, `-duration`, `-label-*`, `-value-*`.

### RadioButton

- `bind:checked` → `bind:group` with the same variable on every radio of the group, plus each radio's own `value` (`<RadioButton bind:group={plan} value="monthly" />`). In v4 `checked` was declared bindable but passed one way, so the binding never updated. `checked` is now only the native attribute, used while `group` is `undefined`.
- To render a group from a list, use the new `RadioGroup` (`items`, `bind:value`, `label` as legend, generated `name`) instead of a wrapper of your own.
- `value` accepts `string | number`; `name` is optional (radios without it do not form a group).
- The root is a `<label>` around the input, so the text selects the radio without an `id` (in v4 `<label for={id}>` did nothing when `id` was missing). Attributes and events go to the input (now every native attribute, not only the v4 list). The callbacks receive the native event as in v4, but are now typed with it (v4 typed them `() => void`).
- New `class` object: `{ container, input, label, description }`.
- Size 21px → 18px; focus ring on `:focus-visible`; disabled is opacity .4 on the whole label.

| v4 | v5 |
|---|---|
| `--radio-button-background-color` | `--radio-button-background` |
| `--radio-button-active-color` | `--radio-button-checked-background` + `--radio-button-checked-border-color` |
| `--radio-button-active-inner-color` | `--radio-button-dot-color` |
| `--radio-button-border-hover-color` | `--radio-button-hover-border-color` |
| `--radio-button-focus-shadow` | `--radio-button-focus-ring-width` + `-color` + `-offset` |
| `--radio-button-disabled-color`, `-disabled-active-color` | `--radio-button-disabled-opacity` |

Unchanged: `--radio-button-border-color`. Defaults follow the same renames (`--radio-button-default-active-color` → `--radio-button-default-checked-background`, ...).

New, optional: `group` (bindable), `description`, `descriptionSnippet`, `card`, `labelSnippet`, `bind:input`, `data-checked` / `data-disabled` / `data-card`. New component: `RadioGroup`.

### SearchBar

- **Name it**: v4 gave every SearchBar the fixed id `search-content` with an `aria-labelledby` pointing to itself (duplicate ids, no accessible name). v5 names the input and its `role="search"` landmark with `label`, else `aria-label`, else the placeholder: pass a `label` ("Search clients") where the placeholder is missing or an example. Tests use `getByRole('searchbox', { name })`.
- **`onsearch(text)`** is new: it fires 300 ms (`debounce`) after the last keystroke, at once on Enter, on the search button and when the field is emptied. Replace the app's own debounce of `oninput` (`setTimeout`, the `debounce` store) with it; the v4 tables debounced the SearchBar themselves (PaginatedTable `searchTimeoutDelay` 300, DynamicTable 800 ms plus Enter): `debounce={800}` keeps that delay, `searchOnType={false}` searches only on Enter and the button. `loading` shows a spinner while results arrive.
- **A clear button (×) appears while there is text** (`clearable`, default `true`; `clearable={false}` for the v4 look). It and Escape set `value` to `''` and call `onsearch('')`.
- The input is `type="search"`: **Enter calls `onsearch` and no longer submits a surrounding form**; Escape with text empties the field. `oninput`, `onchange`, `onkeydown`, `onfocus`, `onblur` are still the native events of the input, called before the built-in keys (`preventDefault()` in `onkeydown` skips them). Other native attributes (`id`, `name`, `maxlength`, `aria-*`) now reach the input; v4's fixed `maxlength="512"`, `aria-autocomplete="both"` and `tabindex="0"` are gone.
- `bind:input` is typed `HTMLInputElement` (v4 `HTMLElement`); `class` keeps `{ container, icon, input }`.
- `iconSnippet` and `inputSnippet` stay. With `inputSnippet` the app input gets none of the built-in behaviour (debounce, `onsearch`, keys, name): bind it to the same `value` and name it.
- Look: 40px (v4 48px) on the theme input tokens (border, radius, font, hover and focus ring), an 18px MDI magnifier. The CSS variables keep their names with new defaults:

| Variable | v4 default | v5 default |
|---|---|---|
| `--search-bar-height` | `3rem` | `40px` |
| `--search-bar-border-radius` | `0.5rem` | `--global-input-radius` |
| `--search-bar-padding` | `0 1rem` | `0 6px 0 12px` |
| `--search-bar-ring-color`, `-ring-width` | contrast-100, `1px` | input border color and width; hover and focus have their own variables |
| `--search-bar-background-color` | background-100 | `--global-input-background` |
| `--search-bar-font-size`, `-line-height` | `.875rem`, `1.5rem` | `--global-input-font-size`, `1.5` |
| `--search-bar-width`, `-max-width` | `100%`, none | `100%`, `none` |

  `--search-bar-height="3rem"` restores the v4 height. Internal classes: `.search-bar-container` → `.aurora-search-bar`, `.search-icon` → `.aurora-search-bar-icon`, `.input` → `.aurora-search-bar input`.

New, optional: `label`, `debounce`, `searchOnType`, `onsearch`, `clearable`, `clearLabel`, `locale` (language of the texts), `loading`, `buttonLabel`, `buttonSnippet({ search })`, native input attributes, `data-filled`, `data-loading`, `--search-bar-gap`, `-color`, `-placeholder-color`, `-icon-size`, `-icon-color`, `-hover-ring-color`, `-focus-ring-color`, `-focus-glow-color`.

### Select

- `options` → `items`, and each `{ value, text, icon }` → `Item` `{ value, label, icon, data }` (`text` → `label`, `icon` an SVG path). `items` is optional.
- `optionAttributes` removed: `class.option` for classes, `itemSnippet` for content; per-option attributes (`disabled`, `title`) have no equivalent.
- `multiple` removed: use Dropdown or Autocomplete.
- `class`: string (which replaced the internal class) → `{ container, label, field, select, option, hint }`.
- `placeholder` now works: a hidden option, and `value` stays `undefined` until the user picks one. In v4 it did nothing and `value` was the first option.
- `Item.value` must be a string or a number, and unique. An item with value `''` is read as "no choice": picking it sets the bound `value` to `undefined`.
- The root is a `<div>`; attributes still go to the `<select>`. The font size is 14px (v4: inherited). The native arrow is replaced by the library chevron. In Chrome/Edge 135+ and Safari 27+ the list is a styled popup with icons and a check mark; Firefox shows the native list.

| v4 | v5 |
|---|---|
| `--select-background-color` | `--select-background` |
| `--select-padding-left`, `--select-padding-right` | `--select-padding-x` |
| `--select-border` | `--select-border-width` + `--select-border-color` |
| `--selecr-active-border-color` (and the documented `--select-active-border-color`) | `--select-focus-border-color` |
| `--option-color` | `--select-option-color` |
| `--option-background-color`, `--option-border-color` | removed: `--select-picker-background`, `--select-option-highlighted-background`, `--select-option-selected-background` (styled popup only) |

Unchanged: `--select-height`, `--select-width`, `--select-color`, `--select-border-radius`. Defaults follow the same renames.

New, optional: `label`, `hint`, `state`, `bind:select`, snippets `labelSnippet`, `hintSnippet`, `stateIconSnippet`, `chevronSnippet`, `itemSnippet`, `checkSnippet`, `--select-picker-*`, `--select-option-*`.

### SimpleTextField

- **Range mode removed**: `range`, `valueTo`, `placeholderTo`, `idTo`, `nameTo`, `inputTo`, `betweenLabel`. Use two fields with their own labels; for a date range use [DatePickerTextField](#datepickertextfield) with `range`.
- `iconSize` removed: `--simple-text-field-icon-size` (`--icon-size` no longer reaches the icons).
- Icon props are SVG paths; the icon snippets lose the `iconSize` parameter.
- Default width 280px → 100% of the container. The input always gets an `id`. `input` is an `HTMLInputElement`.
- An `aria-describedby` passed by the app is merged with the hint id, and its `aria-invalid` is kept (`state="error"` also sets it).
- `hintSnippet` renders inside the hint element; `class.hint` goes on that element, which exists only with a hint.
- Look: 36px high with a border (v4: filled grey, no border), visible focus, visible native date/time picker icon.
- **CSS prefix renamed**: `--simple-textfield-*` → `--simple-text-field-*` (defaults too).

| v4 | v5 |
|---|---|
| `--simple-textfield-background-color` | `--simple-text-field-background` |
| `--simple-textfield-border` | `--simple-text-field-border-width` + `--simple-text-field-border-color` |
| `--simple-textfield-focus-box-shadow` | `--simple-text-field-focus-ring-width` + `-ring-color`, `--simple-text-field-focus-border-color` |
| `--simple-textfield-margin-bottom` | `--simple-text-field-gap` (between label, field and hint) |
| `--simple-textfield-focus-background-color`, `-margin-left`, `-hint-margin-left`, `-transition`, `-range-text-align` | removed |

The others only change prefix: `width`, `max-width`, `outer-gap`, `inner-gap`, `padding`, `height`, `border-radius`, `box-shadow`, `font-size`, `font-weight`, `color`, `hint-font-size`, `hint-color`.

New, optional: `label`, `state`, `labelSnippet`, `stateIconSnippet`, `class.label`, `type` `email` / `tel` / `search` / `url`, `data-state` / `data-disabled` / `data-readonly`.

### Skeleton

- Look: a soft shimmer in sync across all skeletons on the page, radius 4px, no shadow (v4: radius 5px and a large `0 10px 100px` shadow). The shimmer stops with reduced motion.
- Without `--skeleton-height`, a `min-height` of `1em` keeps it visible in a parent without height (v4: 0px tall, invisible). An explicit `--skeleton-height` also sets the minimum, so heights below 1em work; a `--skeleton-default-height` below 1em needs `--skeleton-default-min-height` too.
- It is `aria-hidden`; mark the region that is loading with `aria-busy="true"`.

| v4 | v5 |
|---|---|
| `--skeleton-card-width`, `-card-height` | `--skeleton-width`, `--skeleton-height` |
| `--skeleton-card-min-height` | `--skeleton-min-height` |
| `--skeleton-card-background` | `--skeleton-background` |
| `--skeleton-animation-color` | `--skeleton-highlight-color` |
| `--skeleton-card-max-width`, `-card-max-height`, `-card-min-width`, `-card-padding` | removed: use `class` or `style` |

Defaults follow the same renames (`--skeleton-default-card-*` → `--skeleton-default-*`).

New, optional: `shape` (`rect` \| `circle` \| `text`), `lines`, `class` and native attributes, `data-shape`, `--skeleton-size`, `--skeleton-border-radius`, `--skeleton-duration`, `--skeleton-line-*`, `--skeleton-last-line-width`.

### Switch

- `value` → `checked` (`bind:value` → `bind:checked`); `value={true}` only sets the native attribute.
- `onchange({ detail: { nativeEvent, value } })` → native `onchange(event)`: `e.detail.value` → `e.currentTarget.checked`.
- It is now a focusable `<input role="switch">` (a new tab stop, Space toggles it). App CSS on `.toggle-switch*` stops matching.
- Size 42×22 → 36×20 (`size="lg"`: 46×26), with a border; disabled is opacity .4.

| v4 | v5 |
|---|---|
| `--switch-inactive-background-color` | `--switch-background` |
| `--switch-inactive-box-shadow` | `--switch-box-shadow` (the border is `--switch-border-color` / `-width`) |
| `--switch-active-background-color` | `--switch-checked-background` |
| `--switch-active-box-shadow` | `--switch-checked-box-shadow`, `--switch-checked-border-color` |
| `--switch-handle-width` | `--switch-thumb-size` |
| `--switch-handle-color` | `--switch-thumb-color` and `--switch-checked-thumb-color` |
| `--switch-disabled-*` (6 variables) | `--switch-disabled-opacity` |
| `--switch-translate-x` | same name, but computed by default: remove v4 values |
| `--switch-label-width` (set by v4 HeadersDrawer) | never existed in v4: delete it; the text is `label` |

Unchanged: `--switch-width`, `--switch-height` (now the track). Defaults follow the same renames; `--switch-default-translate-x` is removed (the travel is computed).

New, optional: `size`, `label`, `labelSnippet`, `bind:input`, `class` object, native attributes.

### TabSwitcher

- `ontabClick({ detail: { tab, nativeEvent } })` → `ontabClick({ tab, nativeEvent })`: drop `.detail`. Enter and Space on a focused tab call it too. `ontabKeypress` removed (v4 never called it).
- **Tabs that switch page**: give each tab an `href` instead of calling `goto()` in `ontabClick`. With `href` the switcher is a `<nav>` of links with `aria-current="page"` (middle click, new tab, SvelteKit preloading). Keep `selected` derived from the route; do not keep the `goto` as well.
- Without `href` it is an ARIA tab list: arrows, Home and End move the focus, Enter and Space select, only one tab is in the Tab order. Pass `aria-label`; give tabs a `panelId` when their content is in the same page (`role="tabpanel"` on it).
- `Tab.icon` is an SVG path. The `Tab` type is exported: import it instead of declaring it.
- `mandatory` selects the first enabled tab in the first render (v4: after mount, so server-rendered pages showed no selection), and again when the tabs arrive later.
- `class`: `tabs` → `tab`, `bookmark` → `indicator` (v4 ignored it), `guide` removed; `container` and `selected` unchanged.
- Look: muted 14px tabs without side padding, the selected one in body text color with a gradient underline that slides between tabs (v4: inherited font size, selected tab in primary, 8px padding). `--tab-switcher-selected-color="var(--global-color-primary)"` restores the v4 color. `variant="segmented"` is the pill look.
- Only the tabs scroll; `appendSnippet` stays at the end of the row. Tabs show a focus ring (v4: `outline: none`).
- Markup: `.tabs-container`, `.tab-label`, `.selected-tab`, `.horizontal-guide` → `.aurora-tab-switcher`, `.aurora-tab-switcher-tab`, `[data-selected]`, `.aurora-tab-switcher-indicator`; the line is a box shadow of the root.

| v4 | v5 |
|---|---|
| `--tab-switcher-bookmark-color` | `--tab-switcher-indicator-background` (gradients allowed) |
| `--tab-switcher-selected-color` | same name; default body text (v4: primary-400) |
| `--tab-switcher-gap` | same name; underline tabs lost 8px of side padding, add 16px to keep the v4 spacing |
| `--tab-switcher-guide-color` | same name, drawn at full opacity (v4: 20%) |
| `--tab-switcher-width` | same name |
| `--tab-switcher-default-bookmark-color`, `-default-selected-color`, `-default-gap` | `--tab-switcher-default-underline-indicator-background`, `-underline-selected-color`, `-underline-gap` (and the `-segmented-` ones) |

New, optional: `variant`, Tab `badge` / `href` / `disabled` / `panelId`, `tabSnippet`, `aria-label` / `aria-labelledby` on the tab list, `bind:tabSwitcherElement`, native attributes, `data-variant`, `data-selected`, every other `--tab-switcher-*` variable.

### Textarea

- The `id` is generated with `$props.id()` (stable across server and client) instead of a random cuid.
- Look: bordered field like the other inputs (v4: filled grey, no border), visible focus, 3 rows by default (`rows`; native default 2), resizable vertically (v4: `resize: none`; `--textarea-resize: none` restores it).
- Border, background, padding and shadow are on a wrapper around the `<textarea>`, as in SimpleTextField. `--textarea-height` sets the height of the text area only (v4: the whole box), so `--textarea-height: 130px` is now about 20px taller; its default is `auto` (v4: `100%`).
- `value` is `string | null`. `class` keeps `container`, `label`, `textarea` and adds `field`, `hint`, `counter`.

| v4 | v5 |
|---|---|
| `--textarea-background-color` | `--textarea-background` |
| `--textarea-border` | `--textarea-border-width` + `--textarea-border-color` |
| `--textarea-focus-box-shadow` | `--textarea-focus-ring-width` + `-ring-color`, `--textarea-focus-border-color` |
| `--textarea-label-margin` | `--textarea-gap` (between label, field and hint) |
| `--textarea-margin`, `--textarea-transition` | removed |

The others keep their name: `padding`, `height`, `width`, `border-radius`, `box-shadow`, `font-family`, `font-size`, `font-weight`, `color`, `resize`, `label-font-size`, `label-font-weight`, `label-color`.

New, optional: `hint`, `state`, `counter`, `autoGrow`, `labelSnippet`, `stateIconSnippet`, `hintSnippet`, `counterSnippet`, `bind:textarea`, `data-state` / `data-disabled` / `data-readonly`.

### TimePickerTextField

New in v5, with the `TimePicker` panel it opens: v4 had no time field, so apps wrap `<SimpleTextField type="time">` / `<StandardTextfield type="time">` or a bare `<input type="time">` in local components (`StandardTimePicker` in most apps, a local `TimePickerTextField` or `TimeField` in a few). Replace each wrapper usage with the library field and delete the wrapper:

```svelte
<!-- v4 app -->
<StandardTimePicker name="start" bind:value={start} />

<!-- v5 -->
<TimePickerTextField label="Start" name="start" bind:value={start} />
```

- The value stays a 24-hour `HH:mm` string, also on a 12-hour clock; `HH:mm:ss` (a Postgres `time` column) is read as well. An empty field is `undefined`, not `''`: where the app compares with `''` or sends `''`, use `value ?? ''`.
- Italian apps get the 24-hour clock and the Italian texts from `setDefaultLocale('it')` ([Language of the texts](#language-of-the-texts)) or `locale="it"`: the default `en` shows a 12-hour clock with AM/PM (`hour12` forces either clock).
- A bubbled native `change` on the wrapper becomes `onchange({ value })`, called once per whole valid time (and with `undefined` when it becomes invalid or is cleared); `oninput` stays native.
- `min` / `max` are `HH:mm` (a `max` earlier than `min` crosses midnight); the native `step` in seconds becomes `minuteStep` in minutes, which only sets the options of the panel.
- Wrapper styles (`--simple-textfield-width`, borders, heights) become `--time-picker-text-field-*` or go away (the field is 100% wide).
- Date-and-time wrappers (`StandardDateTimePicker`) become one [DateTimePickerTextField](#datetimepickertextfield).

The field types like the date field (digits only, the colon comes by itself, A/P set AM/PM, an impossible or out-of-range time is an error with `invalidText` and blocks the form), opens the panel in a Menu on desktop and in a bottom Drawer up to 1024px, and closes after the minutes (or AM/PM) are chosen. Helpers `parseTime(text)` → `{ hours, minutes }` and `formatTime({ hours, minutes } | Date)` → `HH:mm` are exported for the code around it.

### Toaster

New in v5: v4 had no toasts, and most apps have their own `Toaster.svelte` copied from the melt-ui demo (`addToast`, `addErrorToast`, `addSuccessToast`, `addWarningToast`, `addInfoToast`, `removeToast` with `{ data: { title, description, ... } }`). The v5 functions have the same names but take the options directly: `addErrorToast({ title, description })`, or a string as the title.

To move without touching the call sites, turn the app's `Toaster.svelte` into an adapter:

```svelte
<script module lang="ts">
	import * as toasts from '@likable-hair/svelte';

	type Data = {
		title: string;
		description?: string;
		closeDelay?: number;
		showLoading?: boolean;
		action?: { label: string; handler: () => void };
	};

	const options = ({ data }: { data: Data }) => ({
		title: data.title,
		description: data.description,
		duration: data.closeDelay,
		loading: data.showLoading,
		action: data.action && { label: data.action.label, onclick: data.action.handler }
	});

	export const addErrorToast = (props: { data: Data }) => toasts.addErrorToast(options(props));
	export const addSuccessToast = (props: { data: Data }) => toasts.addSuccessToast(options(props));
	export const addWarningToast = (props: { data: Data }) => toasts.addWarningToast(options(props));
	export const addInfoToast = (props: { data: Data }) => toasts.addInfoToast(options(props));
	export const removeToast = toasts.removeToast;
</script>

<script lang="ts">
	import { Toaster } from '@likable-hair/svelte';
</script>

<Toaster />
```

Differences from the melt-ui copies:

- `add*` return the id (a number), not an object: `addToast(...).id` → `addToast(...)`.
- The variant comes from the function or `variant`, never from a CSS color (`color: 'info'`, `'green'`, ... are gone).
- `duration` (ms) replaces `closeDelay`, and it works: `0` keeps the toast open (several copies turned `0` into 3000 or ignored the value). Default 5000 (the copies used 3000).
- `loading` replaces `showLoading`; `updateToast(id, { variant: 'success', title, loading: false })` turns it into a result instead of removing it and adding a new one. `progress` shows a determinate bar.
- A click on `action` closes the toast, unless its `onclick` calls `event.preventDefault()` (the copies left it open).
- Position: bottom right on desktop, full width on screens up to 640px (the copies: top right on mobile). Pass `position` to change it.
- At most 5 toasts (`limit`); an identical toast still visible restarts its timer instead of stacking.
- Errors and warnings are announced right away, the others politely (the copies used `role="alert"` for all); the close button has an accessible name.
- The names of the close buttons ("Dismiss") and of the region ("Notifications") follow `locale` on the Toaster, else `setDefaultLocale` ("Chiudi", "Notifiche" in Italian); `closeLabel` and `label` win.
- While a `Dialog` or `Drawer` is open the toasts show inside it and stay clickable.

### Tooltip

- **Renamed**: `ToolTip` → `Tooltip` (`import { Tooltip } from '@likable-hair/svelte'`).
- It has its own surface: a dark one-line label (`variant="plain"`) or a card (`variant="rich"`). In v4 it was an empty Menu and every app drew its card inside (`<div style:background-color=... style:padding=...>`): remove that wrapper and pass `text`, or keep only the content in `children`.
- `menuProps` removed. `menuProps={{ anchor }}` → `placement`: `bottom-center` → `bottom`, `right-center` → `right`, `up-center` → `top`, `left-center` → `left`. `menuProps._activatorGap` → `offset` (default 10px, arrow included). Other Menu props (`_minWidth`, `_left`, `stayInViewport`, ...) have no equivalent: use `--tooltip-max-width` and app CSS; the tooltip always stays in the viewport.
- Default placement `bottom-center` → `top`. Pass `placement="bottom"` for the v4 position.
- `appearTimeout` default `0` → `400` ms. Keyboard focus opens it right away; hovering the next activator just after one closed also opens right away.
- `menuOpen` → `open`. `activator` is still bindable but no longer needs `bind:`.
- Behaviour: it also opens on keyboard focus, stays open while the pointer is over it, closes on Escape and on click, and adds its id to the activator's `aria-describedby` (v4: hover only, no ARIA). On touch screens a tap on the activator toggles it.
- Markup: the tooltip element is always in the DOM (hidden while closed), so screen readers can read the description.

New, optional: `text`, `title`, `titleSnippet`, `variant`, `offset`, `bind:tooltipElement`, `class` and native attributes, `data-side`, `data-variant`, every `--tooltip-*` variable.

### YearPickerTextField

It works like [DatePickerTextField](#datepickertextfield) for one year.

- `menuOpened` → `open` (no default), `mobileDialog` → `mobileDrawer`, `minYearInRange` / `maxYearInRange` → `min` / `max` (same numbers and defaults, 1900–2100; v4 ignored them on mobile). `openingId` removed.
- `onyearClick({ detail: { year } })` and `oninput({ detail: { year } })` → `onchange({ year })` (merge them if both were set): it fires on every change of the year (grid, typing, clear button), not at every key; `oninput` is the native input event.
- It closes after a choice (`closeOnSelect`) and opens aligned to the start of the field (`placement`, v4 centered).
- Typing: four digits; a year outside `min` / `max`, or unfinished when the field loses focus, shows the error state with `invalidText` ("Enter a valid year", "Inserisci un anno valido" in Italian) and makes the form invalid. Setting `selectedYear` to `undefined` now empties the text.
- Snippets and `class` as in DatePickerTextField: `activatorSnippet` removed, `prependInnerSnippet` → `iconSnippet`, the other position snippets take no parameters; `{ activator, textfield }` → `{ container, label, row, field, input, hint, picker }`.
- `--simple-textfield-*` passed to the field become `--year-picker-text-field-*`, as in the DatePickerTextField table. `--button-max-width`, listed in the v4 docs, was never read.
- Look: the DatePickerTextField field with a chevron at the end; the years are a 4-column YearSelector in a Menu, or a bottom Drawer on mobile. Markup: `.year-picker-activator` → `.aurora-year-picker-text-field`.

New, optional: `label`, `hint`, `state`, `invalidText`, `name`, `required`, `readonly`, `id`, `clearable`, `drawerTitle`, texts (`openLabel`, `closeLabel`, `clearLabel`) and `locale` (language of the texts), snippets `labelSnippet`, `hintSnippet`, `stateIconSnippet`, `clearSnippet`, `chevronSnippet`, `bind:input`, native input attributes, `data-*`, `--year-picker-text-field-*` (including `-menu-width` and `-menu-padding`).

### YearSelector

- `onclick({ detail: { year } })` and `onchange({ detail: { year } })` → `onchange({ year })` (merge them if both were set). Clicking the selected year keeps it (v4 set `selectedYear` to `undefined`): `year` is always a number.
- `selectableYears` → `min` / `max` (numbers, default 1900–2100; v4: the 75 years before and after today). A list with holes has no equivalent.
- `labelSnippet({ year })` → `itemSnippet({ year, selected, current })`; `selectorSnippet({ year, handleYearClick })` removed: the cell keeps click and keyboard.
- `class`: string → `{ container, year }`.
- A scrolling 4-column grid in the mono font, scrolled to the chosen year, instead of a vertical list of Buttons; it is a listbox with one Tab stop (arrows, Page Up/Down, Home/End, Enter/Space). `--year-selector-columns="1"` gives a single column. Markup: `.selector-container` → `.aurora-year-selector`, `.aurora-year-selector-year` with `[data-selected]`, `[data-current]`.

| v4 | v5 |
|---|---|
| `--year-selector-height` | same name, `100%` → `auto` |
| `--year-selector-max-height` | same name, `500px` → `240px` |
| `--year-selector-width` | same name, now only the grid (v4: also each year button) |

The `-default-*` names follow.

New, optional: `min`, `max`, `locale` (language of the default name "Year"), `focus()`, `bind:yearSelectorElement`, native attributes, `data-*`, `--year-selector-*` for columns, gap, padding, font, colors and states.

## Not available yet

These v4 exports have no v5 version yet. Keep v4 for screens that need them, or wait for the port.

- **Components**: MediaQuery (use `svelte/reactivity`), MenuOrDrawer, MenuOrDrawerOptions, QuickActions, VerticalDraggableList, InfiniteScroll, CollapsibleDivider, PeriodSelector, PeriodPicker, FileInput, FileInputList, VerticalSwitch, VerticalTextSwitch, IconsDropdown, AvatarDropdown, ToggleList, BoxList, ColorInvertedSelector, SelectableMenuList, SelectableVerticalList, SidebarMenuList, HierarchyMenu, SimpleTable, PaginatedTable, EnhancedPaginatedTable, DynamicTable, GlobalSearchTextField, Avatar, DescriptiveAvatar, Breadcrumb, HeaderMenu, Navigator, LineChart, BarChart, PieChart, SimpleTimeLine, DashboardShaper, CollapsibleSideBarLayout, StableDividedSideBarLayout, UnstableDividedSideBarLayout.
- **Utilities**: `scrollAtCenter`.
- **Stores**: `mediaQuery`, `theme`, `toggleTheme` (see [Dark mode](#dark-mode-and-themes)), `debounce`.
