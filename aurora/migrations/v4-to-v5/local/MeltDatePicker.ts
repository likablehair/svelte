import type { LocalMigration } from '../../types.js';

export default {
	from: 'MeltDatePicker',
	to: 'DatePickerTextField',
	files: ['MeltDatePicker.svelte'],
	contains: ['createDatePicker'],
	summary: 'The local melt-ui `MeltDatePicker` copy becomes `DatePickerTextField` of the library.',
	props: {
		renamed: [
			{ from: 'date', to: 'selectedDate', note: 'A `Date` at local midnight (the copy returned midnight CET).' },
			{ from: 'minValue', to: 'min' },
			{ from: 'maxValue', to: 'max' }
		],
		removed: [
			{
				name: 'defaultValue',
				note: 'The field shows the bound `selectedDate` from the start; `defaultValue={x} bind:date={x}` was there only because the copy overwrote the bound value on mount.',
				drop: true
			}
		]
	},
	manual: [
		{
			id: 'melt-date-picker-initial',
			summary: 'The copy emptied the bound date on mount unless `defaultValue` was the same variable; DatePickerTextField shows the value it receives.',
			action: 'Check the forms that relied on starting empty: initialize their variable to `undefined`.'
		},
		{
			id: 'melt-date-picker-locale',
			summary: 'The copy was always Italian; the field follows `setDefaultLocale` (or `locale`) for the format and the calendar.',
			action: 'Nothing to do in an Italian app that calls `setDefaultLocale("it")`.',
			scope: 'app'
		}
	]
} satisfies LocalMigration;
