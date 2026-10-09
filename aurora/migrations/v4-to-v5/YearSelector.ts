import type { ComponentMigration } from '../types.js';

export default {
	from: 'YearSelector',
	to: 'YearSelector',
	props: {
		removed: [
			{
				name: 'selectableYears',
				note: 'The grid shows every year from `min` to `max` (numbers, default 1900–2100; v4 default: the 75 years before and after the current one): `selectableYears={years}` → `min={first} max={last}`. A list with holes has no equivalent.',
				replacement: 'min, max'
			}
		],
		changed: [
			{
				name: 'disabled',
				note: 'Same meaning; the grid also fades, leaves the Tab order and sets `aria-disabled`.'
			}
		],
		types: [
			{
				name: 'class',
				v4: 'string',
				v5: '{ container?: string; year?: string }',
				note: '`class="x"` → `class={{ container: "x" }}`; `year` goes on each year.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onclick',
				to: 'onchange',
				argument: { 'detail.year': 'year', detail: '' },
				type: '{ year: number }',
				note: '`e.detail.year` → `e.year`. If the usage also has `onchange`, merge the two handlers into one.'
			},
			{
				name: 'onchange',
				argument: { 'detail.year': 'year', detail: '' },
				type: '{ year: number }',
				note: '`e.detail.year` → `e.year`. Always a number now: clicking the selected year keeps it (v4 set it to `undefined`), so checks for `undefined` can go.'
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
				note: 'It replaced the whole year and had to call `handleYearClick` itself. Use `itemSnippet` for the content (the cell keeps click, keyboard and state) and `--year-selector-*` or `class.year` for the look.',
				replacement: 'itemSnippet'
			}
		],
		parameters: [
			{
				name: 'itemSnippet',
				v4: '{ year: number }',
				v5: '{ year: number; selected: boolean; current: boolean }'
			}
		]
	},
	cssVars: {
		changed: [
			{
				name: '--year-selector-height',
				note: 'Height of the grid; default `auto` (v4: `100%`). It scrolls past `--year-selector-max-height`.'
			},
			{ name: '--year-selector-default-height', note: 'v4 `100%`, v5 `auto`.' },
			{
				name: '--year-selector-max-height',
				note: 'Same meaning; default `240px` (v4: `500px`).'
			},
			{ name: '--year-selector-default-max-height', note: 'v4 `500px`, v5 `240px`.' },
			{
				name: '--year-selector-width',
				note: 'Width of the grid only; v4 also gave it to every year button.'
			}
		]
	},
	manual: [
		{
			id: 'year-selector-deselect',
			summary:
				'Clicking the selected year keeps it selected; v4 set `selectedYear` to `undefined` (and crashed the v4 DatePicker).',
			action:
				'Where the app relied on the second click to clear the year, add an explicit clear action that sets `selectedYear = undefined`.',
			when: { props: ['selectedYear'], events: ['onchange'] }
		},
		{
			id: 'year-selector-look',
			summary:
				'A scrolling grid of 4 columns in the mono font (v4: a vertical list of text Buttons, the selected year bigger and bold); the current year has a border, the selected one a primary fill, and the grid scrolls to it when it appears.',
			action:
				'Drop `--button-*` variables passed to style the v4 list; use `--year-selector-columns="1"` for a single column, and the other `--year-selector-*` variables for the look.'
		},
		{
			id: 'year-selector-keyboard',
			summary:
				'It is an ARIA listbox: one Tab stop, the arrows move in the grid, Page Up and Page Down jump three rows, Home and End go to the first and last year, Enter and Space choose. v4 had every year as a Button in the Tab order.',
			action:
				'Give it an accessible name with `aria-label` or `aria-labelledby` (default "Year"). End-to-end tests should use `getByRole("option", { name: "2026" })`.'
		},
		{
			id: 'year-selector-markup',
			summary:
				'Markup and classes changed: `.selector-container` and the wrapped Buttons → `.aurora-year-selector` (`role="listbox"`, it scrolls) and `.aurora-year-selector-year` (`role="option"`) with `[data-selected]` and `[data-current]`.',
			action: 'Rewrite app `:global(...)` selectors that target the v4 markup.',
			scope: 'app'
		}
	],
	added: [
		'`min`, `max`.',
		'`focus()` method, `bind:yearSelectorElement`, native attributes on the grid.',
		'`data-disabled` on the grid; `data-selected`, `data-current` on the years.',
		'`--year-selector-*` variables for columns, gap, padding, font, colors, selected, current, hover, disabled and focus ring.'
	]
} satisfies ComponentMigration;
