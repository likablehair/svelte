import type { GlobalMigration } from '../types.js';

export default {
	package: {
		svelte: '>=5.29 (the components use {@attach}); the peer range stays ^5.0.0',
		droppedDependencies: [
			'@paralleldrive/cuid2',
			'chartjs-adapter-date-fns',
			'date-fns',
			'esm-env',
			'highlight.js',
			'highlightjs-svelte',
			'imask',
			'lodash',
			'luxon',
			'sortablejs',
			'svelte-dnd-action',
			'svelte-dts',
			'svelte-grid'
		],
		add: [
			'@mdi/js, when the app uses MDI icons',
			'every package the app imports itself and used to get through v4 (luxon, lodash, date-fns, ...)'
		],
		exports: {
			removed: ['@likable-hair/svelte/package.json'],
			added: [
				'@likable-hair/svelte/tokens.css',
				'@likable-hair/svelte/base.css',
				'@likable-hair/svelte/themes/*.css',
				'@likable-hair/svelte/tailwind.css',
				'@likable-hair/svelte/tailwind-preset'
			]
		}
	},
	layers: {
		app: '@layer reset, theme, base, global, components, utilities;',
		themeFile:
			'@layer reset, theme, base, global.base, global.theme, global.components, components, utilities;'
	},
	tokens: {
		find: '--global-color-(background|contrast|grey|primary|secondary|error|warning|success)-\\d{2,3}|--global-color-(light|dark)-',
		mappings: [
			{ v4: ['background-50'], role: 'page background', v5: '--global-color-bg' },
			{
				v4: ['background-100'],
				role: 'panels, drawers, tooltips; page bands',
				v5: '--global-color-surface-solid (opaque) or --global-color-surface; page bands --global-color-bg-2'
			},
			{ v4: ['background-200'], role: 'subtle fills, hover', v5: '--global-color-surface-2' },
			{
				v4: ['background-300'],
				role: 'selected fills; borders',
				v5: 'fills --global-color-surface-3, borders --global-color-border'
			},
			{
				v4: ['background-400', 'background-500'],
				role: 'separators, input borders',
				v5: '--global-color-border-strong'
			},
			{ v4: ['contrast-900', 'contrast-950'], role: 'main text', v5: '--global-color-text' },
			{ v4: ['contrast-700', 'contrast-800'], role: 'secondary text', v5: '--global-color-text-2' },
			{
				v4: ['contrast-500', 'contrast-600'],
				role: 'muted text, placeholders',
				v5: '--global-color-text-3'
			},
			{
				v4: ['contrast-50', 'contrast-100', 'contrast-200', 'contrast-300'],
				role: 'borders, dividers, light shadows',
				v5: '--global-color-border, --global-color-border-strong or --global-shadow-*'
			},
			{
				v4: ['primary-500'],
				role: 'brand',
				v5: '--global-color-primary; filled backgrounds --global-fill-primary'
			},
			{
				v4: ['primary-600', 'primary-700'],
				role: 'hover or pressed',
				v5: '--global-color-primary-strong'
			},
			{
				v4: ['primary-50', 'primary-100', 'primary-200', 'primary-300', 'primary-400'],
				role: 'tints, selection (also primary-500 at 20%)',
				v5: '--global-color-primary-soft'
			},
			{
				v4: ['grey-50'],
				role: 'text and icons on primary',
				v5: '--global-color-on-primary'
			},
			{
				v4: ['grey-900'],
				role: 'overlay',
				v5: '--global-color-overlay (+ --global-overlay-blur)'
			},
			{
				v4: ['secondary-500'],
				role: 'accent',
				v5: '--global-color-accent, tints --global-color-accent-soft'
			},
			{
				v4: ['error-500', 'warning-500', 'success-500'],
				role: 'states',
				v5: '--global-color-{error,warning,success}, tints -soft, text on them --global-color-on-{error,warning,success}, filled --global-fill-error'
			}
		],
		usage: [
			{ v4: 'rgb(var(--global-color-x))', v5: 'var(--global-color-y)' },
			{
				v4: 'rgb(var(--global-color-x), .4)',
				v5: 'color-mix(in oklab, var(--global-color-y) 40%, transparent)'
			},
			{ v4: 'Tailwind rgb(var(--global-color-x) / <alpha-value>)', v5: 'bg-y/40 with the preset' }
		]
	},
	icons: {
		find: '["\'](mdi-[a-z0-9-]+)["\']',
		transform:
			"Drop the `mdi-` prefix and camelCase the rest with an `mdi` prefix (`mdi-chevron-down` → `mdiChevronDown`), import it from '@mdi/js' and pass it as an expression: `icon={mdiChevronDown}`."
	},
	callbacks: {
		argument: { 'detail.nativeEvent': '', detail: '' }
	},
	exports: [
		{
			name: 'mediaQuery',
			kind: 'store',
			replacement: 'breakpoints',
			note: 'Same flags and widths, as a reactive object instead of a store: `$mediaQuery.xs` → `breakpoints.xs`, also `breakpoints.mAndDown` and the other `...AndDown` / `...AndUp`. The server counts as wide (`xl`) now.'
		},
		{
			name: 'theme',
			kind: 'store',
			replacement: 'theme',
			note: 'Exported again with the same name: `$theme.dark` keeps working (and `theme.dark` is reactive without `$`), `theme.mode` and `theme.name` are new. `$theme.active` and `$theme.colors` (the runtime colors API, broken in v4) are gone: colors are CSS tokens and themes.'
		},
		{
			name: 'toggleTheme',
			kind: 'function',
			replacement: 'toggleMode()',
			note: 'Same behaviour. The choice is saved only after `rememberAppearance()` (see `global-dark-mode`).'
		},
		{
			name: 'setTheme',
			kind: 'function',
			replacement: "setMode('light' | 'dark' | 'system')",
			note: '`setTheme` still exists but sets a named design theme (`data-theme`). `setTheme("dark")` type-checks and activates a theme that does not exist: replace it with `setMode("dark")`.'
		},
		{
			name: 'countriesList',
			kind: 'utility',
			replacement: 'countryCodes',
			note: 'Only the ISO codes are in the library; names come from `countryName(code, locale)`.'
		},
		{
			name: 'countriesOptions',
			kind: 'utility',
			replacement: 'countryItems(locale, codes)',
			note: 'Returns `Item[]` with localized names, sorted by name.'
		},
		{
			name: 'getCountryInfoByAlpha2',
			kind: 'utility',
			replacement: 'countryName(code, locale), dialCode(code)'
		},
		{
			name: 'FilterBuilder',
			kind: 'utility',
			replacement: 'FilterBuilder',
			note: 'Same name, same methods, same `toJson()` output (the contract with the backends: verified against v4 on the same calls). Bugs fixed, check code that relied on them: `where({ a: 1 })` (object form) did nothing in v4 and now adds a `kind: "object"` condition; `where(key, operator, undefined)` sent the operator as the value and is now skipped; `toJson()` and `modifiers` return copies (v4 `toJson()` returned the internal array, so pushing into it changed the builder); `hasWhereOnColumn` also looks inside groups and subqueries; `on(a, "=", "")` keeps the empty value. `where(callback)` still throws if the callback adds `orderBy`, `select` or `join`. New: `whereNotIn`, `orWhereNotIn`, `whereNotNull`, `orWhereNotNull` (Knex aliases of the `notWhere*` names), `whereBetween(key, [from, to])` (open ends), `clone()`, `FilterBuilder.fromJson(json)`, `orderBy(column)` with `asc` default, `toQueryParam()` (the whole query as one JSON string for a GET parameter, see `global-filter-backends`), exported types `JsonQuery`, `Modifier`, `WhereModifier`, `JoinModifier`, ... No lodash: `Date` values are cloned with `structuredClone` and still serialize as ISO UTC strings.'
		},
		{
			name: 'FilterConverter',
			kind: 'utility',
			replacement: 'filtersToBuilder(value, fields, { builder })',
			note: 'The converter of v4 `Filter[]` is gone with the `Filter` type: definitions become `fields` and the applied state a `value` tree (see Filters, `filters-definitions` and `filters-initial-value`). `new FilterConverter().createBuilder({ filters })` → `filtersToBuilder(value, fields)`; to add the filters to an existing query (search, sort, tenant) pass it as `{ builder }`: it is copied, not changed, and the result has its joins first. Inside a Filters `onchange` the builder is already in the argument (`e.builder`): drop the call there. Also in load functions and server code (it has no DOM dependency). See `global-filter-converter`.'
		},
		{
			name: 'Converter',
			kind: 'utility',
			replacement: 'filtersToBuilder(value, fields, { builder })',
			note: 'Same class as FilterConverter (v4 exported it twice): same migration.'
		},
		{
			name: 'FilterValidator',
			kind: 'utility',
			replacement: 'isConditionComplete(condition, field)',
			note: '`FilterValidator.isValid(filter)` → `isConditionComplete(condition, field)`: whether a condition has a complete value for its operator (operators without a value, such as `empty` or `isTrue`, are always complete; a field can decide with `isComplete(condition)`; by default a custom value is complete when it is not `undefined`, `null`, `""`, an empty array or an empty object). Incomplete conditions are skipped by `filtersToBuilder` and by the count. `countFilters(value, fields)` counts the complete visible ones.'
		},
		{
			name: 'DynamicFilters',
			kind: 'component',
			replacement: 'Filters',
			note: 'The master-detail list of DynamicTable (passed as Filters `contentSnippet`) is replaced by the Filters panel ("Filters" button: every condition in rows, with AND / OR and groups when allowed). Drop it together with `contentSnippet` and its `updateMultiFilterValues` / `updateCustomFilterValues` plumbing; custom inputs go in the Filters `inputSnippet`. Quick filters of the v4 tables (internal QuickFilters) become Filters `pinned` fields (always in the bar; "missing value" = operator `empty`, a three-state bool = `isTrue` / `isFalse` / no condition) and `presets` (chips that add ready conditions).'
		},
		{
			name: 'HeaderMenu',
			kind: 'component',
			note: 'Not ported: no app used it. For a page with a top bar and a menu use SidebarLayout; for a bar alone write a `<header>` in the app with the library Button and Drawer.'
		},
		{
			name: 'QuickActions',
			kind: 'component',
			replacement: 'DataTable selectionActions',
			note: 'Not ported: the floating bar of the selected rows is part of DataTable (`selectionActions`, `selectionActionsSnippet`).'
		},
		{
			name: 'InfiniteScroll',
			kind: 'component',
			replacement: 'Table onendreached',
			note: 'Not ported: Table calls `onendreached` when its last rows come into view, and DataTable has `pagination="infinite"`. Elsewhere use an `IntersectionObserver` on the last element.'
		},
		{
			name: 'Navigator',
			kind: 'component',
			replacement: 'HierarchyMenu',
			note: 'Not ported: it was the list of the v4 Drawer `items`. Put a HierarchyMenu (links with `currentPath`) or a TabSwitcher with `href` in the Drawer.'
		},
		{
			name: 'Breadcrumb',
			kind: 'component',
			note: 'Not ported: no app used it. Write a `<nav aria-label="Breadcrumb">` with links in the app.'
		},
		{
			name: 'VerticalSwitch',
			kind: 'component',
			replacement: 'Switch',
			note: 'Not ported: no app used it. Use Switch for a yes/no value, or TabSwitcher `variant="segmented"` with two tabs for two labelled choices.'
		},
		{
			name: 'VerticalTextSwitch',
			kind: 'component',
			replacement: 'TabSwitcher',
			note: 'Not ported: no app used it. Use TabSwitcher `variant="segmented"` with two tabs.'
		},
		{
			name: 'SelectableVerticalList',
			kind: 'component',
			replacement: 'RadioGroup',
			note: 'Not ported: one app used it outside copied v4 filters. For a list where the user picks one entry use RadioGroup `card` (`title` → `label`, `name` → `value`, `description` and `icon` stay); for a list of results with the keyboard use Autocomplete or AsyncAutocomplete.'
		},
		{
			name: 'SelectableMenuList',
			kind: 'component',
			replacement: 'HierarchyMenu',
			note: 'Not ported: two apps used it, as a column of actions. Use HierarchyMenu with options without `href` and `onoptionClick` (`collapsed` → `iconsOnly`, `label` and `icon` stay), or a column of text Buttons.'
		},
		{
			name: 'CollapsibleDivider',
			kind: 'component',
			replacement: 'Divider',
			note: 'Not ported: no app used it. Use a `<details>` with a Divider `label` in its `<summary>`.'
		},
		{
			name: 'ColorInvertedSelector',
			kind: 'component',
			replacement: 'HierarchyMenu',
			note: 'Not ported (it was the menu inside UnstableDividedSideBarLayout, used directly by one app); available on request. A list of options to choose from is a HierarchyMenu, or a TabSwitcher.'
		},
		{
			name: 'SidebarMenuList',
			kind: 'component',
			replacement: 'HierarchyMenu',
			note: 'Not ported (one app); available on request. HierarchyMenu with `href` on the options and `currentPath={page.url.pathname}` does what `autoDetectUrl` did; `title` → `label`, `url` → `href`, `children` → `options`.'
		},
		{
			name: 'AvatarDropdown',
			kind: 'component',
			note: 'Not ported (one app); available on request.'
		},
		{
			name: 'VerticalDraggableList',
			kind: 'component',
			note: 'Not ported (it was the list inside HeadersDrawer; three files in the apps); available on request.'
		},
		{
			name: 'scrollAtCenter',
			kind: 'utility',
			replacement: "element.scrollIntoView({ block: 'center', behavior: 'smooth' })",
			note: 'Not ported (one app): the browser does it.'
		},
		{
			name: 'debounce',
			kind: 'store',
			note: 'Not ported (one app); available on request. A debounce is a few lines in the app (`clearTimeout` + `setTimeout`).'
		},
	],
	manual: [
		{
			id: 'global-svelte-version',
			summary: 'The components need Svelte 5.29 or later.',
			action: 'Update `svelte` in the app before anything else.',
			scope: 'app'
		},
		{
			id: 'global-dependencies',
			summary: 'v5 has one runtime dependency (`flag-icons`); v4 brought 16.',
			action:
				'Run `svelte-check` and the build: every import that now fails to resolve (`luxon`, `lodash`, `date-fns`, ...) must be added to the app `package.json`.',
			scope: 'app'
		},
		{
			id: 'global-layers',
			summary: 'All library CSS lives in cascade layers; unlayered app CSS always wins.',
			action:
				'Put the `layers.app` line at the top of the main app CSS, before any `@import`. Move global element resets (`button {}`, `input {}`, `* { margin: 0 }`, ...) into `@layer reset { ... }`, otherwise they restyle the inside of the components.',
			scope: 'app'
		},
		{
			id: 'global-tailwind-3',
			summary: 'Tailwind 3 preflight removes component backgrounds and borders unless it is layered.',
			action:
				"Wrap `@tailwind base;` in `@layer reset { ... }` and add `presets: [aurora]` (`import aurora from '@likable-hair/svelte/tailwind-preset'`) to `tailwind.config.js`. Token overrides placed in Tailwind's `@layer base` end up inside `reset` and lose: move them out of the layer.",
			scope: 'app'
		},
		{
			id: 'global-tailwind-4',
			summary: 'Tailwind 4 needs the layer line and the library theme mapping.',
			action:
				"Put the `layers.app` line before `@import 'tailwindcss'`, then `@import '@likable-hair/svelte/tailwind.css'`. Note that it redefines `rounded-{xs,sm,md,lg,xl}`, `shadow-{sm,md,lg}`, `font-sans` and `font-mono`.",
			scope: 'app'
		},
		{
			id: 'global-internal-classes',
			summary:
				'Internal class names changed (`.button`, `.chip`, `.textfield`, `.hint`, `.row`, `.overlay`, `._teleported`, `[data-dialog]` → `aurora-{component}-{part}` and `data-*`).',
			action:
				'Search app CSS for `:global(...)` selectors that target library internals and rewrite them against the v5 classes and `data-*` attributes, or replace them with CSS variables.',
			scope: 'app'
		},
		{
			id: 'global-color-tokens',
			summary:
				'v4 color tokens (RGB triplets) do not exist in v5: overrides stop working and uses become undefined.',
			action:
				'Find `tokens.find` in app CSS and style attributes; replace each use following `tokens.mappings` by the role the color plays there (not by step number), and `rgb(var(...))` following `tokens.usage`. Remove `--global-color-light-*` / `--global-color-dark-*` overrides: set the v5 tokens with `light-dark()` instead, or use the `classic` theme.'
		},
		{
			id: 'global-dark-mode',
			summary:
				'Dark mode follows `color-scheme` and `data-mode` on `<html>`; `.dark` / `.light` classes do nothing.',
			action:
				"Replace `setTheme('dark')` with `setMode('dark')` and `toggleTheme()` with `toggleMode()`, `.dark` selectors with `[data-mode='dark']` (plus the `prefers-color-scheme` branch), and Tailwind `darkMode: 'class'` with the variant in MIGRATION.md. v4 saved the mode by itself: call `rememberAppearance()` once in the root `+layout.svelte` (it reads and writes the same `theme` key of v4, so users keep their choice) and add `<svelte:head>{@html '<script>' + appearanceScript() + '</script>'}</svelte:head>` there, so the page does not flash in the wrong mode. An app without dark mode sets `data-mode=\"light\"` on `<html>`.",
			scope: 'app'
		},
		{
			id: 'global-icons',
			summary:
				'Every icon prop takes an SVG path; `"mdi-*"` strings type-check but draw nothing, and the global `.mdi` classes are gone.',
			action:
				'Apply `icons.transform` to every icon prop listed in the component rules and to `Item.icon` values in data. Markup that uses `class="mdi mdi-*"` directly needs `@mdi/font` loaded by the app, or an `<Icon path>`.'
		},
		{
			id: 'global-callbacks',
			summary: 'Callbacks receive native events or plain objects instead of `{ detail: {...} }`.',
			action:
				'Apply `callbacks.argument` (or the component rule) to every callback of a library component, including handlers defined as functions elsewhere in the file and their TypeScript types (`CustomEvent<...>`, `ComponentProps<...>["onclick"]`).'
		},
		{
			id: 'global-fonts',
			summary:
				'Tokens name Geist, Bricolage Grotesque and Geist Mono; the library does not load them.',
			action:
				'Either load those fonts in the app or set `--global-font-family`, `--global-font-family-display` and `--global-font-family-mono` to the app fonts in an unlayered `:root` rule.',
			scope: 'app'
		},
		{
			id: 'global-overlays',
			summary:
				'Dialog, Drawer and Menu use the top layer: the page is inert while a Dialog or Drawer is open, their content inherits from where it is written and unmounts when closed.',
			action:
				'Check app toasts, chat widgets and third-party popups that must work above an open Dialog. Move local state of Dialog/Drawer content into the parent. App Escape handlers should check `event.defaultPrevented`. Rules on `html { overflow }` defeat the scroll lock.',
			scope: 'app'
		},
		{
			id: 'global-default-locale',
			summary:
				'Required in every Italian app: without `setDefaultLocale(\'it\')` the date and time fields read and write in English (MM/DD/YYYY, 12-hour clock), so a typed "05/03" is saved as May 3; in development they warn in the console. Texts and formats follow `locale` (BCP 47; Italian and English built in, other languages get the English texts): the `locale` prop of a component wins over `setDefaultLocale`, which wins over the default `en`. v4 was Italian by default in the date components (dd/MM/yyyy, Italian names, weeks from Monday) and in some texts ("Annulla" / "Salva", "N Selezionati"), and had `lang` props (default `en`) elsewhere.',
			action:
				"In the root `src/routes/+layout.svelte` of an Italian app, import `setDefaultLocale` from `@likable-hair/svelte` and call `setDefaultLocale('it')` in its `<script>`: it is a Svelte context (safe with SSR) that reaches every library component of the app, the Toaster and the content of dialogs included. With paraglide, follow the active language: `setDefaultLocale(() => getLocale())` (`getLocale` from `$lib/paraglide/runtime`). Then drop `locale=\"it\"` where it only restored the Italian default and the Italian texts passed only to translate the English defaults (`invalidText`, `closeLabel`, `cancelText=\"Annulla\"`, ...); v4 `lang=\"it\"` becomes `locale=\"it\"`, or nothing. Components that v4 showed in English without `lang` (Dropdown placeholder \"Select\", NoData \"No data available\", Filters, FilterEditor) become Italian: pass `locale=\"en\"` where English is wanted. Text props passed by the app always win. Components rendered outside the layout (`mount()`, tests, a second root) need their own `setDefaultLocale` or `locale`.",
			scope: 'app'
		},
		{
			id: 'global-app-toaster',
			summary:
				'v5 has toasts (`<Toaster />`, `addToast`, `addErrorToast`, `addSuccessToast`, `addWarningToast`, `addInfoToast`, `updateToast`, `removeToast`); most apps have their own `Toaster.svelte` copied from the melt-ui demo with the same function names but `{ data: { title, description, closeDelay, showLoading, action } }` arguments.',
			action:
				'Turn the app `Toaster.svelte` into the adapter shown in MIGRATION.md ("Toaster"), so call sites keep working: map `data.closeDelay` → `duration` (`0` now really keeps it open; default 5000), `data.showLoading` → `loading`, `data.action.handler` → `action.onclick`. Then check: `add*(...).id` → `add*(...)` (they return the id); CSS color strings (`color: "info"`, `"green"`) → the function or `variant`; remove-then-add loading flows → `updateToast(id, { variant: "success", title, loading: false })`; action handlers that must keep the toast open call `event.preventDefault()`. Remove the app melt-ui dependency once nothing else uses it.',
			scope: 'app'
		},
		{
			id: 'global-dates',
			summary:
				'Date components work with `Date` values at local midnight; `toISOString()` converts them to UTC and gives the previous day in Italy, and `new Date("yyyy-mm-dd")` reads the string as UTC midnight. v4 brought `luxon`, which apps used to convert these dates.',
			action:
				"Where a value bound to a date component is turned into a string, replace `date.toISOString()` (and `.toISOString().split('T')[0]`, `.slice(0, 10)`) with `toISODate(date)`, and where a `yyyy-mm-dd` string becomes the value, `new Date(text)` with `parseISODate(text)` (both from `@likable-hair/svelte`). luxon conversions (`DateTime.fromJSDate(d).toISODate()`, `DateTime.fromISO(s).toJSDate()`) are correct, but the app must declare `luxon` in its `package.json`.",
			scope: 'app'
		},
		{
			id: 'global-time-fields',
			summary:
				'v5 has a time field, `TimePickerTextField` (and the `TimePicker` panel); v4 had none, so apps wrap `<SimpleTextField type="time">` / `<StandardTextfield type="time">` or a bare `<input type="time">` in local components (`StandardTimePicker`, a local `TimePickerTextField`, `TimeField`).',
			action:
				'Find the local wrappers (`grep -rlE "type=\\"time\\"" src`, usually `$lib/components/common/StandardTimePicker.svelte`) and replace each usage with `<TimePickerTextField bind:value label=... name=... />` from `@likable-hair/svelte`; then delete the wrapper. The value stays a 24-hour `HH:mm` string (`HH:mm:ss` from a Postgres `time` column is read too, and the field writes back `HH:mm` only when the user changes it). Differences to check: (1) Italian apps get the 24-hour clock and the Italian texts from `setDefaultLocale("it")` in the root layout (step `global-default-locale`) or from `locale="it"` (the default `en` shows a 12-hour clock with AM/PM; the value is 24-hour anyway); (2) an empty field is `undefined`, not `""`: code that compares with `""` or sends `""` to the backend checks for both or uses `value ?? ""`; (3) `onchange` on the wrapper (often a bubbled native `change`) becomes `onchange({ value })`, called once per whole valid time, not at every key; `oninput` stays native; (4) wrapper props move to the field: `label`, `name` (hidden input with `HH:mm`), `required`, `disabled`, `placeholder`, `hint`, `state`, `min` / `max` as `HH:mm` (native `step` in seconds → `minuteStep` in minutes); (5) the wrapper CSS (`--simple-textfield-width`, borders, heights) becomes `--time-picker-text-field-*` or is dropped (the field is 100% wide). Wrappers that pair a date and a time (`StandardDateTimePicker`) become one `DateTimePickerTextField` (step `global-date-time-fields`).',
			scope: 'app'
		},
		{
			id: 'global-date-time-fields',
			summary:
				'v5 has a date and time field, `DateTimePickerTextField` (a `DatePicker` and a `TimePicker` in one panel, value `Date`); v4 had none, so apps pair a date field and a time field in local components (`StandardDateTimePicker` in likable-tools, addibox, lupette, epass, mufasa, evote; `StandardDateTimePickerTextfield` in stramoniumai).',
			action:
				'Find the wrappers (`grep -rlE "StandardDateTimePicker" src`, usually `$lib/components/common/StandardDateTimePicker.svelte`, which renders `StandardDatepicker` + `StandardTimePicker`) and replace each usage with `<DateTimePickerTextField bind:value label=... name=... />` from `@likable-hair/svelte` (plus `locale="it"` when the app has no `setDefaultLocale("it")`, step `global-default-locale`); then delete the wrapper. The value stays a `Date` with the local date and time (seconds at 0). Differences to check: (1) the wrappers default `value` to `new Date()` (now): the field starts empty, so where the old default mattered pass `value={new Date()}` (or a rounded time) explicitly; (2) an empty or invalid field is `undefined`; (3) `name` submits one hidden input with the local `yyyy-MM-ddTHH:mm` instead of the date input (`name`) and the time input (`name + "-time"`): update the form action or the backend that read the two fields (`parseISODateTime(text)` reads it back); (4) `bind:value` keeps working, a bubbled `change` / `on:change` becomes `onchange({ value })`; stramoniumai\'s `selectedDateTime` / `menuOpened` become `bind:value` / `bind:open`, `error` → `state="error"`, `hint` stays; (5) wrapper props move to the field: `label`, `hint` (`info` in evote), `required`, `disabled`, `min` / `max` (instants, `Date`), `isDateDisabled`, `minuteStep`; (6) the two-column layout CSS of the wrapper (`.container { display: flex }`, widths) goes away: the field is one input, 100% wide; widths and borders become `--date-time-picker-text-field-*`; (7) Italian apps rely on `setDefaultLocale("it")` or pass `locale="it"` (the default `en` is MM/dd/yyyy with a 12-hour clock and English texts). Code that converts the value with `toISOString()` sends UTC: use `toISODateTime(date)` for a local `yyyy-MM-ddTHH:mm`, or keep `toISOString()` where the backend expects an instant.',
			scope: 'app'
		},
		{
			id: 'global-filter-converter',
			summary:
				'`FilterConverter` / `Converter` and the v4 `Filter` type are gone; queries come from `filtersToBuilder(value, fields, { builder })`.',
			action:
				'Search the app (components, stores, `+page.ts`, `+page.server.ts`, `+server.ts`, utils) for `FilterConverter`, `Converter`, `createBuilder(` and `Filter[]`. Where the filters come from a Filters component, use the `builder` of its `onchange` and delete the conversion. Elsewhere (first load, SSR, exports, jobs, saved filters) convert the definitions to `fields` and the state to a tree (Filters rule, `filters-definitions` / `filters-initial-value`) and call `filtersToBuilder(value, fields)`; when the code then added more conditions to the returned builder (search, tenant, sorting), build those first and pass them as `{ builder }`, or keep adding them to the result. Keep `fields` in one module shared by the page and the load function.',
			scope: 'app'
		},
		{
			id: 'global-filter-backends',
			summary:
				'The filters can now send `kind: "in"` for selects, OR groups and nested groups, `yyyy-MM-dd` strings for dates, Postgres regex and array operators, and the kinds `null`, `column`, `inBuilder`, `jsonSuperset` and `raw` (JSON keys with `cast`); the backends (`FilterModifierApplier`, not in this repo) replay them with different fidelity.',
			action:
				'Check the backend of the app before turning features on. (1) Select fields with one value send `where(column, "=", v)` (`notIn`: `"<>"`), with several values `{ method: "where", kind: "in", key, value: [...] }` (`notIn`: `logicalOperator: "andNot"`), instead of a group of `orWhere` (v4 `equal`) or of `whereNot` (v4 `different`): every applier handles `in`, and it fixes the select OR of lupette and likable-tools, whose appliers flatten groups. (2) `allowOr` and `maxDepth` are off by default (AND only, as v4); turn them on only where the applier replays `grouped` with its `logicalOperator` at every level: variant A (astro, ermes, h24, maya, quantum, cbam) is fine; B (biblio, biblio-smart-folder, contattorapido, tatum, addibox, stramoniumai) applies OR only inside a group, which is how Filters sends it; C (billboards, mufasa, emarket) and E\' (epass, new-vigipass) join groups with AND; D (ganymede) reads one level; E (lupette, likable-tools) flattens groups. With OR at the root every condition goes inside one `grouped`, so managers that read first-level modifiers by key (astro, cbam, ganymede, maya, lupette, quantum, stramoniumai) stop seeing them. (3) GET requests: Adonis parses the query string with `qs` at depth 5 and `arrayLimit` 20, and no app raises them. Anything deeper than `filtersBuilder[modifiers][i][children][j][key]` is silently mangled: arrays inside a group or a subquery become `{ "[0]": ... }` (a select with 2+ values inside an OR group, a `through` field with 2+ values, `whereIn` with a callback and an array inside), a group inside a group loses its children; arrays with more than 20 items become objects (v4 selects had the same limit). `qs` turns numbers and booleans into strings, also inside objects (a `json` field without `cast` sends `whereJsonSuperset(column, { visits: 5 })`, which arrives as `{ visits: "5" }` and no longer matches a JSON number). Fix, in order of preference: send `filtersBuilder: builder.toQueryParam()` (the whole query as one JSON string) and change the backend line that reads it to `typeof input === "string" ? JSON.parse(input) : input` (it keeps accepting the old format); or raise `http.qs.parse.depth` and `arrayLimit` in the backend `config/app.ts`; or send `builder.toJson()` in a POST body. (4) Date fields with `dateOnly: true` send `yyyy-MM-dd` strings instead of `Date` (ISO UTC timestamps): set it only on `date` columns. (5) `contains` sends `ilike` with `%v%` and escapes `%`, `_` and `\\`; appliers A–E wrap like/ilike values in `%` again (same results), E\' does not. They add `%` only when the operator is exactly `like` or `ilike`, so the other text operators reach Postgres unchanged on every applier (all use `pg`): `notContains` (`not ilike "%v%"`, `not like` with `caseSensitive`), `startsWith` / `endsWith` (regex `~*`, or `~` with `caseSensitive`, value `^v` / `v$` with the regex characters escaped), `is` / `isNot` / `anyOf` / `noneOf` (regex `~*` / `!~*` on `^v$` or `^(a|b)$`, so they ignore case; `=` / `<>` / `in` with `caseSensitive`, as v4), `is` / `isNot` with `words` (`~*` / `!~*` on `\\mword\\M`). (6) Sorting added by a field `apply` (`orderBy`) comes after the conditions in the modifiers, as before. (7) Kinds: A–D replay `null`, `column`, `jsonSuperset` and `inBuilder`; E (lupette, likable-tools) and E\' (epass, new-vigipass) know only `simple`, `object`, `grouped` and `in`, and throw "where kind not supported" (a 500) for `empty` / `notEmpty` (`whereNull`, also string `empty` with `blankIsEmpty`), `compareWith` and `whenTrue` / `whenFalse` with `whereColumn` (`column`), `through` (`inBuilder`) and `json`. On those apps pass `negativesIncludeEmpty={false}` (on by default, it adds `whereNull` to every negative operator) and `operatorSet="basic"` to Filters (the default `standard` set has `empty` / `notEmpty`), or `typeOperators` / field `operators` without them, and avoid those options; or add the missing branches to the applier (copy them from variant A). (8) Select fields with `array: true` send `where(column, "&&", [...])` (`in`), `"@>"` (`all`), `whereNot(column, "&&", [...])` (`notIn`), `whereNull` or `= "{}"` (`empty`, the empty array as a Postgres literal, so GET requests keep it): Postgres array operators as simple wheres, replayed by every applier that knows `null`. (9) `json` fields without `cast` send `kind: "jsonSuperset"` (A–D; negations inside a `whereNot` group). With `cast` they send `kind: "raw"`, clause `(??#>>?)::<cast> <operator> ?` with bindings `[column, "{key,path}", value]`: only B replays `raw` (A, C, D throw "where kind not supported"). Relying on `raw`, in B or by adding it elsewhere, means the server runs whatever SQL condition a client sends (the clause is not checked server side): prefer accepting `raw` only for whitelisted columns and that exact clause shape, or expose the key as a real column or a view. Security, outside the library: the appliers accept any column, table and subquery from the client (and B passes `kind: "raw"` to `whereRaw`); a whitelist per manager is recommended.',
			scope: 'app'
		},
		{
			id: 'global-filter-state',
			summary:
				'Filter state saved by the app (stores, sessionStorage / localStorage, URL presets, load functions) was a v4 `Filter[]` rebuilt by hand; in v5 it is the `value` tree, plain JSON.',
			action:
				'Store `serializeFilters(value)` (a JSON string) and restore with `parseFilters(json, fields)`, which drops conditions on unknown fields and returns an empty tree for invalid input: replaces the stores that survived navigation, the session storage copies and the code that re-applied `active` / `value` to each definition. URL: `filtersToParam(value)` is the same tree without the node identities (shorter): write `?filters=${encodeURIComponent(filtersToParam(value))}` into the URL (links, `replaceState`, or `goto` when the load function fetches the data), and read it with `filtersFromParam(url.searchParams.get("filters"), fields)` in the load function (new identities, unknown fields dropped, empty tree for missing or invalid input). URL presets made of separate parameters → build the tree there (`createFilters([filterCondition("status", "in", [{ value: url.searchParams.get("status"), label: ... }])])`). In both cases compute the first query in the load function with `filtersToBuilder(value, fields)` and pass `value` to the page for `bind:value`. Named sets of filters the app kept itself (saved views, favourite searches; v4 had no such feature) → Filters `savable` (kept in memory), `savedKey="<page>-filters"` (kept in `localStorage`) or `bind:saved` / `onsavedchange` (a `SavedFilter[]` of `{ id, name, value }` to store in the backend). Saved sets and URL parameters carry the whole tree, `locked` conditions included, and applying a saved set replaces the conditions: keep constraints the user must not change (tenant, permissions) in the `builder` prop or in the backend, not only in locked conditions. Saved trees keep working when fields are added; rename a field `name` only with a conversion of the saved trees. Saved v4 `Filter[]` cannot be read by `parseFilters`: convert them once or drop them.',
			scope: 'app'
		},
		{
			id: 'global-ssr-mobile',
			summary: 'Components now render the desktop variant on the server (v4 rendered the mobile one).',
			action: 'Check first paint on mobile for layouts that depended on the v4 server default.',
			scope: 'app'
		}
	]
} satisfies GlobalMigration;
