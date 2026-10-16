import type { ComponentMigration } from '../types.js';

export default {
	from: 'ToggleList',
	to: 'ToggleList',
	props: {
		changed: [
			{
				name: 'disabled',
				note: 'Now really disables the buttons; v4 only faded the list and the chips stayed clickable.'
			}
		],
		types: [
			{
				name: 'items',
				v4: '{ value: string | number; label?: string | number; icon?: string; data?: Data }[]',
				v5: 'Item<Data>[]',
				note: 'Same fields; `icon` is an `@mdi/js` path instead of an MDI class (`"mdi-plus"` → `mdiPlus`). Import the `Item` type from the library.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { detail: '' },
				type: '{ select?: Item<Data>; unselect?: Item<Data>; selection: Item<Data>[] }',
				note: 'With `multiple={false}` picking another option now also reports the replaced one in `unselect` (v4 left it undefined). `e.detail.selection` becomes `e.selection`.'
			}
		]
	},
	cssVars: {
		renamed: [{ from: '--toggle-list-heigth', to: '--toggle-list-height', note: 'Typo fixed.' }]
	},
	manual: [
		{
			id: 'toggle-list-single',
			kind: 'review',
			summary:
				'With `multiple={false}` a second click on the selected option keeps it selected; v4 emptied the selection.',
			action:
				'Usually the wanted behavior (a choice like a group of radio buttons). Where an empty selection must stay possible, add `mandatory={false}`. Code that handled the empty selection after a second click can stay.',
			when: { props: ['multiple'] }
		},
		{
			id: 'toggle-list-look',
			kind: 'review',
			summary:
				'The options are toggle buttons (`ActivableButton`, `aria-pressed`) in a `role="group"` instead of chips; text-only buttons show the state dot.',
			action:
				'Give the list an `aria-label` (or `aria-labelledby`) naming the choice. Remove app CSS aimed at the chips inside the list; style the buttons with the `--activable-button-*` variables, hide the dot with `dot={false}`, change the height with `size`. A list with a single item used as an on/off switch reads better as `Switch` or a single `ActivableButton`.'
		},
		{
			id: 'toggle-list-bindings',
			kind: 'review',
			summary: 'An `onchange` written as `() => handler` never called the handler, and `values` without `bind:` never followed the clicks in the app.',
			action:
				'Check every usage: write `onchange={handler}` or `onchange={(e) => handler(e)}`, and use `bind:values` when the app reads the selection.',
			when: { events: ['onchange'] }
		}
	],
	added: [
		'`mandatory`: on by default with `multiple={false}`, it keeps the last selected option pressed.',
		'`size` and `dot` for the buttons, `itemSnippet` for their content.',
		'`bind:toggleListElement`, `class` and native attributes (such as `aria-label`) on the root.',
		'`data-multiple` and `data-disabled` on the root.',
		'`--toggle-list-gap`.'
	]
} satisfies ComponentMigration;
