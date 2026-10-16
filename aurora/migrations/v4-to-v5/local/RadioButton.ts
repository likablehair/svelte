import type { LocalMigration } from '../../types.js';

export default {
	from: 'RadioButton',
	to: 'RadioGroup',
	files: ['RadioButton.svelte'],
	contains: ['userSelected'],
	summary: 'The local `RadioButton` copy, a whole group despite its name, becomes `RadioGroup` of the library.',
	props: {
		renamed: [
			{ from: 'legend', to: 'label' },
			{ from: 'options', to: 'items' },
			{ from: 'userSelected', to: 'value' },
			{ from: 'flexDirection', to: 'orientation' }
		],
		values: [{ name: 'orientation', values: { column: 'vertical', row: 'horizontal' } }],
		removed: [{ name: 'fontSize', note: 'The text follows the theme; `--radio-button-label-font-size` changes it.', drop: true }]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: { selectedValue: 'value' },
				type: '{ value: string | number | undefined; item: RadioItem | undefined; event: Event }'
			},
			{
				name: 'on:change',
				to: 'onchange',
				argument: {},
				type: '{ value: string | number | undefined; item: RadioItem | undefined; event: Event }',
				note: 'Svelte 4 event directive of older app code.'
			}
		]
	},
	manual: [
		{
			id: 'radio-button-first-option',
			summary: 'The copies selected the first option by themselves (and failed with no options); RadioGroup starts with nothing selected.',
			action: 'Where the first option must start selected, initialize the bound variable with its value.'
		}
	]
} satisfies LocalMigration;
