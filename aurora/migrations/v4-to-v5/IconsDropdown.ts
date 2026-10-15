import type { ComponentMigration } from '../types.js';

export default {
	from: 'IconsDropdown',
	to: 'IconsDropdown',
	props: {
		toCssVar: [
			{
				name: 'width',
				cssVar: '--icons-dropdown-width',
				note: 'Default `fit-content`.'
			},
			{ name: 'minWidth', cssVar: '--icons-dropdown-min-width' },
			{
				name: 'menuWidth',
				cssVar: '--icons-dropdown-menu-width',
				note: 'v4 drew a 60px column of icons; the list is now a grid of tiles as wide as its columns (`columns`, default the number of options up to 5). Drop the prop unless a fixed width is wanted.'
			}
		],
		defaults: [
			{
				name: 'values',
				v4: '[]',
				v5: 'undefined',
				note: 'With `bind:values` on an uninitialized variable, the variable stays `undefined` until something is selected: initialize it to `[]` where the app reads `values[0]`.'
			}
		],
		types: [
			{
				name: 'items',
				v4: 'IconItem<Data>[] (not exported: { value, icon, data? })',
				v5: 'IconItem<Data>[] ({ value, label, icon, data? })',
				note: '`IconItem` is exported from the package root: drop local copies of the type. `label` is required and `icon` is an SVG path: see the manual step `icons-dropdown-items`. `values` has the same type.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { detail: '' },
				type: '{ select?: IconItem<Data>; unselect?: IconItem<Data>; selection: IconItem<Data>[] }',
				note: 'Picking another icon now also reports the replaced one in `unselect`. The usual `e.detail.selection[0].value` becomes `e.selection[0].value`.'
			}
		]
	},
	manual: [
		{
			id: 'icons-dropdown-items',
			summary:
				'Every option needs a `label`, its accessible name, Tooltip and type-ahead text (v4 options had no text at all), and `icon` is an SVG path (v4: an MDI class name).',
			action:
				'Add a short `label` to each object in `items` and `values` (for example "Paragraph", "Heading 1", "Align left", in the language of the app) and apply the global icon transform to every `icon` (`"mdi-format-header-1"` → `mdiFormatHeader1` from `@mdi/js`). Also pass `label` to the component to name the button ("Text style", "Alignment"): without it screen readers hear "Select".',
			when: { props: ['items', 'values'] }
		},
		{
			id: 'icons-dropdown-look',
			summary:
				'The button shows the chosen icon in a gradient tile and is as tall as a Button of the same `size` (md 34px); the list is a grid of 36px tiles (chosen one with the gradient, highlighted one tinted) with a Tooltip on the highlighted tile. v4 drew a plain button and a 60px column of 20px icons.',
			action:
				'Check editor toolbars and other places where the dropdown sits next to buttons. `--icons-dropdown-value-*` restyles the tile in the button, `--icons-dropdown-option-*` the tiles of the list, `columns` the grid.'
		},
		{
			id: 'icons-dropdown-css-vars',
			summary:
				'The v4 overrides on the inner Dropdown no longer fit: `--button-padding` now replaces the padding tuned around the tile, `--button-width` has no effect on this button, and `--autocomplete-selected-item-color` does not reach the tiles.',
			action:
				'Remove `--button-width` and `--button-padding` from the IconsDropdown (use `--icons-dropdown-padding` only if the default padding does not fit). Replace `--autocomplete-selected-item-color` with `--icons-dropdown-option-selected-color` and `--icons-dropdown-option-selected-background`, or drop it to keep the theme look.',
			when: { cssVars: ['--button-width', '--button-padding', '--autocomplete-selected-item-color'] }
		},
		{
			id: 'icons-dropdown-clear',
			summary:
				'With `clearable` the clear X is a separate button ("Clear selection") shown in place of the arrow, hidden while `disabled`; in v4 it was an icon inside the button that also cleared a disabled dropdown.',
			action: 'Check flows that cleared a disabled IconsDropdown.',
			when: { props: ['clearable'] }
		}
	],
	added: [
		'`label`: accessible name of the button and title of the mobile drawer, not shown.',
		'`multiple` with `maxVisibleIcons` (tiles in the button, then "+N"), `mandatory`, `closeOnSelect`.',
		'`columns` of the grid; the four arrows move through it, a letter jumps to the first label that starts with it.',
		'Everything from `Dropdown`: `placement`, `mobileDrawer`, `variant`, `size`, `name`, `bind:open`, `bind:buttonElement`, `locale`, `selectionText`, `onclose`, `class` per part (plus `tile`).',
		'Snippets `valueSnippet`, `itemSnippet`, `chevronSnippet`, `clearSnippet`, `emptySnippet`.',
		'`--icons-dropdown-*` variables for the button padding, the tiles in the button and in the list, the grid gap and the menu width.'
	]
} satisfies ComponentMigration;
