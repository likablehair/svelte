import type { ComponentMigration } from '../types.js';

const styledOnly =
	'Only in the styled list (Chrome/Edge 135+, Safari 27+); other browsers show their native list.';

export default {
	from: 'Select',
	to: 'Select',
	props: {
		renamed: [
			{
				from: 'options',
				to: 'items',
				note: 'Each option changes shape too: `{ value, text, icon }` → `Item` `{ value, label, icon, data }`. See `select-items`.'
			}
		],
		removed: [
			{
				name: 'optionAttributes',
				note: 'v4 spread the same attributes on every option. Classes go in `class.option`, content in `itemSnippet`; per-option attributes (`disabled`, `title`) have no equivalent.',
				replacement: 'class.option, itemSnippet'
			},
			{
				name: 'multiple',
				note: 'A native attribute that v4 passed through; v5 picks one value only. Use Dropdown, or Autocomplete with `multiple`.'
			}
		],
		types: [
			{
				name: 'items',
				v4: 'Option[] = { value: string | number | undefined; text: string; icon?: string }[]',
				v5: 'Item<Data>[] = { value: string | number; label?: string | number; icon?: string; data?: Data }[]',
				note: 'Optional (default `[]`). `Item` is exported by the package.'
			},
			{
				name: 'class',
				v4: 'string (replaced the internal class of the `<select>`)',
				v5: '{ container?: string; label?: string; field?: string; select?: string; option?: string; hint?: string }',
				note: '`class="x"` → `class={{ select: "x" }}`; layout classes (margins, width, grid placement) go on `container`. See `select-class`.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: {},
				type: 'Event',
				note: 'Already the native event in v4: no argument rewrite.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--select-background-color', to: '--select-background' },
			{ from: '--select-default-background-color', to: '--select-default-background' },
			{
				from: '--selecr-active-border-color',
				to: '--select-focus-border-color',
				note: 'v4 read this misspelled name; the border also takes this color while the list is open.'
			},
			{
				from: '--select-active-border-color',
				to: '--select-focus-border-color',
				note: 'Documented in v4 but never read (the code read `--selecr-active-border-color`): it starts working in v5.'
			},
			{ from: '--select-default-active-border-color', to: '--select-default-focus-border-color' },
			{
				from: '--option-color',
				to: '--select-option-color',
				note: `${styledOnly} The native list uses \`--select-color\`.`
			},
			{ from: '--option-default-color', to: '--select-default-option-color' }
		],
		removed: [
			...['--select-padding-left', '--select-padding-right'].map((name) => ({
				name,
				note: 'One value for both sides; the end side also leaves room for the chevron and the state icon.',
				replacement: '--select-padding-x'
			})),
			...['--select-default-padding-left', '--select-default-padding-right'].map((name) => ({
				name,
				note: 'One value for both sides.',
				replacement: '--select-default-padding-x'
			})),
			{
				name: '--select-border',
				note: 'Split in two: `1px solid red` → `--select-border-width="1px"` + `--select-border-color="red"`.',
				replacement: '--select-border-width + --select-border-color'
			},
			{
				name: '--select-default-border',
				note: 'Split in two.',
				replacement: '--select-default-border-width + --select-default-border-color'
			},
			{
				name: '--option-background-color',
				note: `${styledOnly} The list background and the highlighted and selected options have their own variables.`,
				replacement:
					'--select-picker-background, --select-option-highlighted-background, --select-option-selected-background'
			},
			{
				name: '--option-default-background-color',
				note: styledOnly,
				replacement:
					'--select-default-picker-background, --select-default-option-highlighted-background, --select-default-option-selected-background'
			},
			{
				name: '--option-border-color',
				note: `Options have no border; the list has one. ${styledOnly}`,
				replacement: '--select-picker-border-color'
			},
			{
				name: '--option-default-border-color',
				note: `Options have no border; the list has one. ${styledOnly}`,
				replacement: '--select-default-picker-border-color'
			}
		]
	},
	manual: [
		{
			id: 'select-items',
			summary:
				'`options` becomes `items` and each option changes shape (`text` → `label`, `icon` an SVG path); `Item.value` must be a string or a number and unique, since it keys the list (duplicates throw `each_key_duplicate`).',
			action:
				'Rename `text` to `label` where the arrays are built (often a `.map` far from the component) and convert `icon` with the global icon rule. A "none" option with `value: undefined` becomes `placeholder` (then `value` is `undefined` until a choice) or gets a real value such as `"none"`; never `""`, which the component reads as "no choice". Remove duplicate values.',
			when: { props: ['options'] }
		},
		{
			id: 'select-placeholder',
			summary:
				'`placeholder` now works: a hidden, disabled option shown in the field, and `value` stays `undefined` until the user picks an item. In v4 it did nothing and the first option was selected.',
			action:
				'Check code that relied on the first option being preselected when `placeholder` was set. With `required`, the form cannot be submitted while the placeholder is shown.',
			when: { props: ['placeholder'] }
		},
		{
			id: 'select-class',
			summary:
				'`class` is an object; a v4 string replaced the internal class of the `<select>`, so the component lost its own styles.',
			action:
				'Pass the class as `class={{ select: "..." }}` (layout classes on `container`) and remove app CSS that rebuilt the field look (border, height, padding): the v5 styles now stay, and unlayered app CSS still wins over them.',
			when: { props: ['class'] }
		},
		{
			id: 'select-look',
			summary:
				'The root is a `<div>` with label, field and hint (attributes still go to the `<select>`); the field is 36px high with a border and a focus ring, text is 14px (v4: inherited) and the native arrow is replaced by the library chevron. In Chrome/Edge 135+ and Safari 27+ the list is a styled popup with icons and a check mark; Firefox keeps the native list.',
			action:
				'Check the font size in dense forms (`--select-font-size`) and app CSS that treated the `<select>` as the root (`.select`, `:global(select)`, margins).'
		}
	],
	added: [
		'`label` + `labelSnippet`, `hint` + `hintSnippet`, `state` (`error` | `success`) + `stateIconSnippet`, as SimpleTextField.',
		'`itemSnippet` (rich option content), `checkSnippet`, `chevronSnippet` in the styled list.',
		'`bind:select`, `id` (generated when missing).',
		'`data-state`, `data-disabled`, `data-empty` attributes.',
		'`--select-picker-*`, `--select-option-*`, `--select-check-color` for the styled list.'
	]
} satisfies ComponentMigration;
