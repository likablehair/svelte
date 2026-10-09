import type { ComponentMigration } from '../types.js';

export default {
	from: 'MonthSelector',
	to: 'MonthSelector',
	props: {
		changed: [
			{
				name: 'class',
				note: 'Still an object of classes per part: `container` unchanged, `buttons` → `month` (each month is a `role="option"` cell, not a Button).'
			}
		],
		defaults: [
			{
				name: 'locale',
				v4: "'it'",
				v5: "'en'",
				keepV4: 'locale="it"',
				note: 'Without it the month names are English. Add `locale="it"` to every usage that omits it, unless the app wants English.'
			},
			{
				name: 'monthFormat',
				v4: "'long'",
				v5: "'short'",
				keepV4: 'monthFormat="long"',
				note: 'v4 had no prop and showed full names ("Gennaio"); v5 shows short ones ("Gen"). Screen readers always read the full name.'
			}
		],
		types: [
			{
				name: 'locale',
				v4: "'it' | 'en'",
				v5: 'string (BCP 47)',
				note: 'Any locale `Intl` knows.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onclick',
				to: 'onchange',
				argument: { 'detail.monthIndex': 'month', detail: '' },
				type: '{ month: number }',
				note: '`e.detail.monthIndex` → `e.month` (0 to 11). Called when the user chooses a month, also with Enter and Space; not for months disabled by `min` / `max`.'
			}
		]
	},
	snippets: {
		renamed: [
			{
				from: 'labelSnippet',
				to: 'itemSnippet',
				note: 'The parameters change too: see `snippets.parameters`.'
			}
		],
		removed: [
			{
				name: 'selectorSnippet',
				note: 'It replaced the whole month without a way to choose it (no handler was passed). Use `itemSnippet` for the content (the cell keeps click, keyboard and state) and `--month-selector-*` or `class.month` for the look.',
				replacement: 'itemSnippet'
			}
		],
		parameters: [
			{
				name: 'itemSnippet',
				v4: '{ month: number; monthName: string }',
				v5: '{ month: number; label: string; name: string; selected: boolean; current: boolean; disabled: boolean }',
				note: '`monthName` (full name) → `name`; `label` is the name in `monthFormat`.'
			}
		]
	},
	cssVars: {
		changed: [
			{
				name: '--month-selector-height',
				note: 'Height of the grid; default `auto` (v4: `100%`). The rows no longer stretch: with a fixed height the months stay at the top.'
			},
			{
				name: '--month-selector-default-height',
				note: 'v4 `100%`, v5 `auto`.'
			}
		]
	},
	manual: [
		{
			id: 'month-selector-look',
			summary:
				'Same 3-column grid, but the months are cells with short names (v4: text Buttons with full names, filled primary when selected); the current month of `year` has a border, the selected one a primary fill.',
			action:
				'Drop `--button-*` variables passed to style the v4 buttons; use `--month-selector-*` (`-selected-background`, `-hover-background`, `-padding`, `-columns`, ...).'
		},
		{
			id: 'month-selector-keyboard',
			summary:
				'It is an ARIA listbox: one Tab stop, the arrows move in the grid, Home and End go to the first and last month, Enter and Space choose. v4 had 12 Buttons in the Tab order.',
			action:
				'Give it an accessible name with `aria-label` or `aria-labelledby` (default "Month"). End-to-end tests should use `getByRole("option", { name: <full month name> })`.'
		},
		{
			id: 'month-selector-markup',
			summary:
				'Markup and classes changed: `.selector-container` and the Buttons → `.aurora-month-selector` (`role="listbox"`) and `.aurora-month-selector-month` (`role="option"`) with `[data-selected]`, `[data-current]`, `[data-disabled]`.',
			action: 'Rewrite app `:global(...)` selectors that target the v4 markup.',
			scope: 'app'
		}
	],
	added: [
		'`year`, `min`, `max` (months outside them are disabled) and `disabled`.',
		'`monthFormat`.',
		'`focus()` method, `bind:monthSelectorElement`, native attributes on the grid.',
		'`data-disabled` on the grid; `data-selected`, `data-current`, `data-disabled` on the months.',
		'`--month-selector-*` variables for columns, gap, padding, colors, selected, current, hover, disabled and focus ring.'
	]
} satisfies ComponentMigration;
