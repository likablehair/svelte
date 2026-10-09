import type { ExportChange, GlobalMigration } from '../types.js';

const pending = (kind: ExportChange['kind'], names: string[]): ExportChange[] =>
	names.map((name) => ({ name, kind, pending: true }));

export default {
	package: {
		svelte: '>=5.29 (the components use {@attach}); the peer range stays ^5.0.0',
		droppedDependencies: [
			'@paralleldrive/cuid2',
			'chart.js',
			'chartjs-adapter-date-fns',
			'chartjs-plugin-zoom',
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
			name: 'MediaQuery',
			kind: 'component',
			replacement: "MediaQuery from 'svelte/reactivity'",
			note: 'Svelte 5 has it: `const mobile = new MediaQuery("max-width: 1024px")`, then `mobile.current`. The server renders the desktop variant now.'
		},
		{
			name: 'mediaQuery',
			kind: 'store',
			replacement: "MediaQuery from 'svelte/reactivity'",
			note: 'Replace the store subscription with a `MediaQuery` instance per query.'
		},
		{
			name: 'theme',
			kind: 'store',
			replacement: 'getMode(), getTheme()',
			note: '`$theme.dark` → `getMode() === "dark"` (not reactive; the app keeps its own state if it needs to react).'
		},
		{
			name: 'toggleTheme',
			kind: 'function',
			replacement: "setMode(isDark ? 'light' : 'dark')",
			note: '`isDark` is `getMode() === "dark"`, or `getMode() === "system"` and `matchMedia("(prefers-color-scheme: dark)").matches`.'
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
			name: 'Converter',
			kind: 'utility',
			pending: true,
			note: 'Same as FilterConverter (v4 exported it twice).'
		},
		...pending('utility', ['scrollAtCenter', 'FilterBuilder', 'FilterConverter', 'FilterValidator']),
		...pending('store', ['debounce']),
		...pending('component', [
			'MenuOrDrawer',
			'MenuOrDrawerOptions',
			'QuickActions',
			'VerticalDraggableList',
			'InfiniteScroll',
			'CollapsibleDivider',
			'Calendar',
			'DatePicker',
			'MonthSelector',
			'YearSelector',
			'DatePickerTextField',
			'YearPickerTextField',
			'PeriodSelector',
			'PeriodPicker',
			'FileInput',
			'FileInputList',
			'VerticalSwitch',
			'VerticalTextSwitch',
			'IconsDropdown',
			'AvatarDropdown',
			'ToggleList',
			'BoxList',
			'ColorInvertedSelector',
			'SelectableMenuList',
			'SelectableVerticalList',
			'SidebarMenuList',
			'HierarchyMenu',
			'SimpleTable',
			'Paginator',
			'PaginatedTable',
			'EnhancedPaginatedTable',
			'DynamicTable',
			'Filters',
			'DynamicFilters',
			'FilterEditor',
			'GlobalSearchTextField',
			'SearchBar',
			'Avatar',
			'DescriptiveAvatar',
			'Breadcrumb',
			'HeaderMenu',
			'Navigator',
			'LineChart',
			'BarChart',
			'PieChart',
			'SimpleTimeLine',
			'DashboardShaper',
			'CollapsibleSideBarLayout',
			'StableDividedSideBarLayout',
			'UnstableDividedSideBarLayout'
		])
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
				"Replace `setTheme('dark')` / `toggleTheme()` with `setMode(...)`, `.dark` selectors with `[data-mode='dark']` (plus the `prefers-color-scheme` branch), and Tailwind `darkMode: 'class'` with the variant in MIGRATION.md. Restore the saved mode before the first paint with an inline script in `app.html`. An app without dark mode sets `data-mode=\"light\"` on `<html>`.",
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
			id: 'global-default-texts',
			summary: 'Default texts are English (v4 often defaulted to Italian or had `lang` props).',
			action: 'Pass the texts as props where the app relied on the Italian defaults.',
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
			id: 'global-ssr-mobile',
			summary: 'Components now render the desktop variant on the server (v4 rendered the mobile one).',
			action: 'Check first paint on mobile for layouts that depended on the v4 server default.',
			scope: 'app'
		}
	]
} satisfies GlobalMigration;
