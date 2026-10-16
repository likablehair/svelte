import type { LocalMigration } from '../../types.js';

export default {
	from: 'RadioGroup',
	to: 'RadioGroup',
	files: ['RadioGroup.svelte'],
	contains: ['checkedValue'],
	summary: 'The local `RadioGroup` copy becomes `RadioGroup` of the library.',
	props: {
		renamed: [
			{ from: 'legend', to: 'label' },
			{ from: 'options', to: 'items' },
			{
				from: 'checkedValue',
				to: 'value',
				note: 'The selected value; pass a variable with `bind:value` to read the choice without `onchange`.'
			}
		],
		removed: [
			{ name: 'containerPaddingTop', note: 'Space around the group comes from the layout.', drop: true },
			{ name: 'containerPaddingBottom', note: 'Space around the group comes from the layout.', drop: true },
			{ name: 'containerPaddingLeft', note: 'Space around the group comes from the layout.', drop: true },
			{ name: 'containerPaddingRight', note: 'Space around the group comes from the layout.', drop: true }
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { detail: 'value', selectedValue: 'value' },
				type: '{ value: string | number | undefined; item: RadioItem | undefined; event: Event }',
				note: 'The chosen value is `e.value` (the copies passed it as `e.detail` or `e.selectedValue`).'
			},
			{
				name: 'on:change',
				to: 'onchange',
				argument: { detail: 'value' },
				type: '{ value: string | number | undefined; item: RadioItem | undefined; event: Event }',
				note: 'Svelte 4 event directive of older app code: `e.detail` becomes `e.value`.'
			}
		]
	},
	manual: [
		{
			id: 'radio-group-form',
			summary: 'The copies wrapped the radios in a `<form>`; RadioGroup is a `<fieldset>` and can sit inside a form of the page.',
			action: 'Nothing to do; a click on a label now selects its option (it did not in some copies).'
		}
	]
} satisfies LocalMigration;
