import type { LocalMigration } from '../../types.js';

export default {
	from: 'DateRangePicker',
	to: 'DatePickerTextField',
	files: ['DateRangePicker.svelte'],
	contains: ['createDateRangePicker'],
	summary: 'The local melt-ui `DateRangePicker` copy becomes `DatePickerTextField` of the library with `range`.',
	props: {
		renamed: [
			{ from: 'labelDatePicker', to: 'label' },
			{ from: 'descriptionDatePicker', to: 'hint' },
			{ from: 'validFrom', to: 'selectedDate', note: 'The start of the range, a `Date` at local midnight.' },
			{ from: 'validTo', to: 'selectedDateTo', note: 'The end of the range.' },
			{ from: 'from', to: 'selectedDate', note: 'The start of the range, a `Date` at local midnight.' },
			{ from: 'to', to: 'selectedDateTo', note: 'The end of the range.' },
			{ from: 'minValue', to: 'min' },
			{ from: 'maxValue', to: 'max' },
			{
				from: 'showApply',
				to: 'confirm',
				note: 'The calendar works on a draft that Apply saves; Cancel, Escape and a click outside discard it.'
			},
			{ from: 'showClear', to: 'clearable', note: 'With `confirm` the bottom of the calendar also has Clear.' },
			{ from: 'twoMonthsView', to: 'months', note: 'Two months side by side in the menu (one on phones).' },
			{ from: 'applyText', to: 'applyLabel' }
		],
		values: [{ name: 'months', values: { true: '2', false: '1' } }],
		removed: [
			{
				name: 'defaultStartDate',
				note: 'The field shows the bound `selectedDate` from the start and follows it when the app changes it.',
				drop: true
			},
			{ name: 'defaultEndDate', note: 'The field shows the bound `selectedDateTo` from the start.', drop: true }
		],
		defaults: [{ name: 'range', v4: 'a range', v5: 'one date', keepV4: 'range', behaviour: true }]
	},
	events: {
		changed: [
			{
				name: 'on:apply',
				to: 'onchange',
				argument: { 'detail.from': 'selectedDate', 'detail.to': 'selectedDateTo' },
				type: '{ selectedDate: Date | undefined; selectedDateTo: Date | undefined }',
				note: 'With `confirm`, `onchange` runs on Apply and on Clear (with both dates `undefined`), and when a date is typed in the field.'
			}
		]
	},
	manual: [
		{
			id: 'date-range-picker-clear',
			kind: 'edit',
			summary: 'The `clear` event of the copy is gone: Clear calls `onchange` with both dates `undefined`.',
			action: 'Move the code of the `on:clear` handler into the `onchange` handler, for when `selectedDate` is `undefined`; the `{#key}` blocks that remounted the picker after a clear are no longer needed.',
			when: { events: ['on:clear'] }
		}
	]
} satisfies LocalMigration;
