import type { ComponentMigration, Removal, Rename } from '../types.js';

const renamed: [string, string][] = [
	['element-padding', 'option-padding'],
	['element-border-radius', 'option-border-radius'],
	['element-background-color', 'option-background'],
	['element-color', 'option-color'],
	['element-hover-background-color', 'option-hover-background'],
	['element-hover-color', 'option-hover-color'],
	['element-selected-background-color', 'option-selected-background'],
	['element-selected-color', 'option-selected-color'],
	['element-selected-font-weight', 'option-selected-font-weight']
];

const removed: [string, string, string?][] = [
	['height', 'The menu is as tall as its options. Put it in a container with a height and `overflow: auto` (SidebarLayout already scrolls it).'],
	['sub-options-padding', 'Nested options are indented under a dashed line.', '--hierarchy-menu-children-indent'],
	['element-cursor', 'Options always have the pointer cursor, disabled ones `not-allowed`.'],
	['element-active-background-color', 'No pressed state: the hover and the selected colors remain.'],
	['element-active-color', 'No pressed state: the hover and the selected colors remain.'],
	['icon-button-padding', 'Icons are a fixed slot of `--hierarchy-menu-icon-size`; the space around them is `--hierarchy-menu-option-padding` and `--hierarchy-menu-option-gap`.', '--hierarchy-menu-option-gap']
];

export default {
	from: 'HierarchyMenu',
	to: 'HierarchyMenu',
	props: {
		types: [
			{
				name: 'options',
				v4: '{ label: string; name: string; icon?: string; href?: string; options?: Option[] }[] (icon = MDI class, two levels, href ignored)',
				v5: 'HierarchyMenuOption[] (icon = SVG path, href renders a link, any depth, plus badge and disabled)',
				note: 'Apply the global icon transform to `icon` values, also in the nested `options`. Import the type with `import { type HierarchyMenuOption } from "@likable-hair/svelte"` instead of declaring it in the app.'
			}
		],
		changed: [
			{
				name: 'selected',
				note: 'Still the `name` of the selected option; with `currentPath` it is set from the URL, so the app no longer derives it with `startsWith` chains (see `hierarchy-menu-links`).'
			},
			{
				name: 'expanded',
				note: 'Now bindable, and the parents of the selected option open by themselves: a hard-coded list only to show the selected child can go.'
			},
			{
				name: 'iconsOnly',
				note: 'Labels become tooltips and a parent opens a menu with its children (v4 hid the children and selected the parent). A badge becomes a dot on the icon; an option without icon shows its first letter.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onoptionClick',
				argument: { 'detail.option': 'option', detail: '' },
				type: '{ option: HierarchyMenuOption; nativeEvent: MouseEvent }',
				note: 'The same object without `detail`: `e.detail.option` → `e.option`. Not called for a parent without `href`, which only opens and closes (v4 selected it and called the handler).'
			}
		]
	},
	snippets: {
		parameters: [
			{
				name: 'prependSnippet',
				v4: '{ option }',
				v5: '{ option, selected, depth }',
				note: 'It replaces the icon only: the arrow of parents is drawn by the menu.'
			},
			{ name: 'optionSnippet', v4: '{ option }', v5: '{ option, selected, depth }' },
			{
				name: 'appendSnippet',
				v4: '{ option }',
				v5: '{ option, selected, depth }',
				note: 'Rendered after the link or button of the option, not inside it, so it can hold buttons; hidden with `iconsOnly` as in v4.'
			}
		]
	},
	cssVars: {
		renamed: renamed.flatMap(([from, to]): Rename[] => [
			{ from: `--hierarchy-menu-${from}`, to: `--hierarchy-menu-${to}` },
			{ from: `--hierarchy-menu-default-${from}`, to: `--hierarchy-menu-default-${to}` }
		]),
		removed: removed.flatMap(([name, note, replacement]): Removal[] => [
			{ name: `--hierarchy-menu-${name}`, note, replacement },
			{ name: `--hierarchy-menu-default-${name}`, note }
		]),
		changed: [
			{
				name: '--hierarchy-menu-gap',
				note: 'Space between options, also between a parent and its first child; default 2px (v4: 4px).'
			},
			{ name: '--hierarchy-menu-width', note: 'Same meaning.' }
		]
	},
	manual: [
		{
			id: 'hierarchy-menu-links',
			summary:
				'Options can be links now: with `href` the option is an `<a>` (middle click, new tab, SvelteKit preloading) and `currentPath` selects the option whose `href` is the longest match of the page path.',
			action:
				'Where `onoptionClick` maps `name` to a route with `goto(...)`, put that route in the `href` of each option, pass `currentPath={page.url.pathname}` (from `$app/state`), and delete both the `goto` chain and the code that derives `selected` from the URL. Keep `onoptionClick` only for side effects (closing a drawer is done by SidebarLayout). Do not combine `href` with a `goto`: the page would navigate twice.',
			when: { events: ['onoptionClick'] }
		},
		{
			id: 'hierarchy-menu-parents',
			summary:
				'A parent without `href` only opens and closes its children: v4 also selected it and called `onoptionClick`.',
			action:
				'If a parent opened a page in v4 (its name has a route in the app), give it an `href`: it becomes a link with a separate arrow button for the children.',
			when: { props: ['options'] }
		},
		{
			id: 'hierarchy-menu-style-props',
			summary:
				'Style props for the icons of the menu (`--icon-size="20px"`, `--icon-cursor`) no longer reach them; the selected look of v4 was a solid primary pill, v5 a soft gradient with a bar on the left.',
			action:
				'Replace `--icon-size` on the menu with `--hierarchy-menu-icon-size` and drop `--icon-cursor`. Drop `--hierarchy-menu-element-selected-background-color="rgb(var(--global-color-primary-500))"` and `-selected-color="white"` unless the app wants to keep the v4 solid pill (then use `--hierarchy-menu-option-selected-background` and `-color` with v5 tokens).',
			when: { cssVars: ['--icon-size', '--icon-cursor', '--hierarchy-menu-element-selected-background-color'] }
		}
	],
	added: [
		'`currentPath`: selects the option whose `href` matches the page path.',
		'HierarchyMenuOption `badge` and `disabled`; options nested to any depth.',
		'`bind:expanded`; arrow keys, Home and End; `aria-current` on the selected option.',
		'`locale`, `aria-label`, `class` parts (`container`, `option`, `selected`, `children`), `bind:hierarchyMenuElement`, native attributes on the `<nav>`.',
		'`data-selected`, `data-ancestor`, `data-open`, `data-depth` on every row, `data-icons-only` on the root.',
		'Every other `--hierarchy-menu-*` variable (icons, indicator, badge, dot, caret, children, flyout).'
	]
} satisfies ComponentMigration;
