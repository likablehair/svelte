import type { ComponentMigration } from '../types.js';

export default {
	from: 'TabSwitcher',
	to: 'TabSwitcher',
	props: {
		changed: [
			{
				name: 'class',
				note: 'Still an object of classes per part, with other keys: `container` (unchanged), `tabs` → `tab`, `selected` (unchanged), `bookmark` → `indicator` (v4 ignored it), `guide` removed (the line is the bottom of the root: `--tab-switcher-guide-color`, `--tab-switcher-guide-width`).'
			},
			{
				name: 'mandatory',
				note: 'Same meaning, now applied in the first render (v4: after mount) and again when the tabs arrive later; it skips disabled tabs.'
			}
		],
		types: [
			{
				name: 'tabs',
				v4: '{ name: string; label: string; icon?: string }[] (icon = MDI class)',
				v5: 'Tab[] (icon = SVG path, plus badge, href, disabled, panelId)',
				note: 'Apply the global icon transform to `icon` values in the tab data. Import the type with `import { type Tab } from "@likable-hair/svelte"` instead of declaring it in the app.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'ontabClick',
				argument: { 'detail.nativeEvent': 'nativeEvent', 'detail.tab': 'tab', detail: '' },
				type: '{ tab: Tab; nativeEvent: MouseEvent }',
				note: 'The same object without `detail`: `e.detail.tab` → `e.tab`. Handler types written as `Parameters<NonNullable<ComponentProps<typeof TabSwitcher>["ontabClick"]>>[0]` keep working. Enter and Space on a focused tab call it too. When the handler only calls `goto()`, see `tab-switcher-navigation`.'
			}
		],
		removed: [
			{
				name: 'ontabKeypress',
				note: 'v4 declared it but never called it: drop it. Keyboard selection calls `ontabClick`.'
			}
		]
	},
	cssVars: {
		renamed: [
			{
				from: '--tab-switcher-bookmark-color',
				to: '--tab-switcher-indicator-background',
				note: 'Takes any CSS background, a gradient included.'
			},
			{
				from: '--tab-switcher-default-bookmark-color',
				to: '--tab-switcher-default-underline-indicator-background',
				note: 'The segmented look has `--tab-switcher-default-segmented-indicator-background`.'
			},
			{
				from: '--tab-switcher-default-selected-color',
				to: '--tab-switcher-default-underline-selected-color',
				note: 'The segmented look has `--tab-switcher-default-segmented-selected-color`.'
			},
			{
				from: '--tab-switcher-default-gap',
				to: '--tab-switcher-default-underline-gap',
				note: 'The segmented look has `--tab-switcher-default-segmented-gap`. Underline tabs have no side padding now: see `--tab-switcher-gap`.'
			}
		],
		changed: [
			{
				name: '--tab-switcher-selected-color',
				note: 'Text color of the selected tab, as in v4; the default is the body text color (v4: primary-400), the indicator carries the brand color.'
			},
			{
				name: '--tab-switcher-gap',
				note: 'Still the space between tabs, but underline tabs lost the 8px side padding of v4: the same gap looks 16px tighter. Add 16px to the v4 value, or set `--tab-switcher-padding`.'
			},
			{
				name: '--tab-switcher-guide-color',
				note: 'v4 drew the line at 20% opacity; v5 uses the color as it is. Pass a lighter color, or drop it (the default is `--global-color-border`).'
			},
			{
				name: '--tab-switcher-default-guide-color',
				note: 'Used at full opacity now (v4: 20%); the default is `var(--global-color-border)`.'
			},
			{
				name: '--tab-switcher-width',
				note: 'Width of the root, which holds the tabs and `appendSnippet`. Only the tabs scroll now; v4 scrolled the append content with them.'
			}
		]
	},
	manual: [
		{
			id: 'tab-switcher-navigation',
			summary:
				'Tabs that switch page can be links now: with `href` the switcher is a `<nav>` of `<a>` with `aria-current="page"`, so middle click, new tab and SvelteKit preloading work.',
			action:
				'Where `ontabClick` only calls `goto(...)` for the clicked tab (typically in a `+layout.svelte`), add `href` with that URL to each tab, remove the `goto` (and the handler if nothing else is left), and keep `selected` derived from the current route. Keep `ontabClick` for side effects that are not navigation. Do not combine `href` with a `goto` in `ontabClick`: the page would navigate twice.',
			when: { events: ['ontabClick'] }
		},
		{
			id: 'tab-switcher-look',
			summary:
				'Default look changed: tabs are muted text at 14px, the selected one takes the body text color and a gradient underline that slides between tabs, and the line under the tabs is a border token; v4 inherited the font size, colored the selected tab primary and used 8px padding.',
			action:
				'Usually accept it. For the v4 colors set `--tab-switcher-selected-color="var(--global-color-primary)"`; for the inherited size `--tab-switcher-font-size="inherit"`. `variant="segmented"` gives the pill look of the prototype for view switches (day / week / month).'
		},
		{
			id: 'tab-switcher-panels',
			summary:
				'Without `href` the tabs are an ARIA tab list: arrows, Home and End move the focus, Enter and Space select, and only one tab is in the Tab order.',
			action:
				'Give the switcher an accessible name with `aria-label` (it reaches the tab list). When the tabs show content in the same page, give each tab a `panelId` and render the content in an element with that `id` and `role="tabpanel"`.'
		},
		{
			id: 'tab-switcher-markup',
			summary:
				'Markup and classes changed: v4 `.tabs-container`, `.tab-label`, `.selected-tab` (with an `::after` underline) and `.horizontal-guide` are now `.aurora-tab-switcher`, `.aurora-tab-switcher-tab`, `[data-selected]` and `.aurora-tab-switcher-indicator`; the line is a box shadow of the root.',
			action:
				'Rewrite app CSS that targets the v4 classes, or use the `class` parts and the `--tab-switcher-*` variables. Remove CSS that hid the focus outline: tabs show a focus ring for keyboard users.'
		},
		{
			id: 'tab-switcher-wrappers',
			summary:
				'Many apps wrap the switcher in `$lib/components/common/StandardTabSwitcher.svelte`, which adds `marginTop` / `marginBottom` and forwards the rest; older copies re-dispatch `on:tab-click` with `createEventDispatcher`.',
			action:
				'Wrappers typed as `ComponentProps<typeof TabSwitcher>` with `{...rest}` keep working and expose the new props. Copies with their own `Tab` type should import `type Tab` from the library; copies that dispatch `tab-click` should forward an `ontabClick` prop instead, and their callers move from `on:tab-click={handler}` to `ontabClick={handler}` reading `e.tab`.',
			scope: 'app'
		}
	],
	added: [
		'`variant`: `underline` (default) | `segmented`.',
		'Tab fields `badge`, `href` (tabs as links in a `<nav>`), `disabled`, `panelId` (`aria-controls`); type `Tab` exported.',
		'ARIA tab list with keyboard navigation (arrows, Home, End, Enter, Space).',
		'`tabSnippet({ tab, selected })` for custom tab content.',
		'`aria-label` / `aria-labelledby` forwarded to the tab list; native attributes and `bind:tabSwitcherElement` on the root.',
		'Sliding indicator; the selected tab is scrolled into view when the tabs overflow.',
		'`data-variant` on the root, `data-selected` on the selected tab.',
		'`--tab-switcher-color`, `-hover-color`, `-padding`, `-border-radius`, `-font-*`, `-icon-*`, `-guide-width`, `-list-*`, `-indicator-*`, `-badge-*`, `-focus-ring-*`, `-disabled-opacity`, `-append-gap`, `-duration`, `-easing`.'
	]
} satisfies ComponentMigration;
