import type { ComponentMigration } from '../types.js';
import { periodManual, removedProps } from './PeriodPicker.js';

export default {
	from: 'PeriodSelector',
	to: 'PeriodSelector',
	props: {
		removed: [
			...removedProps,
			{
				name: 'showTimeRangeLabel',
				note: 'The panel always shows the start and end dates at the bottom.'
			},
			{
				name: 'setTimespanLabel',
				note: 'The panel has no label of the period any more; `PeriodPicker` has `labelSnippet`.'
			}
		],
		types: [
			{
				name: 'quickSelectOptions',
				v4: '{ value: T; label: string }[]',
				v5: 'PeriodPreset<T>[]',
				note: 'Same fields plus an optional `range`, needed by presets that are not among the 7 the library knows.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: {},
				type: '{ timespanSettings: TimespanSettings<T>; from?: Date; to?: Date }',
				note: 'Still called at every change; it also receives the days the period covers.'
			}
		]
	},
	cssVars: {
		renamed: [
			{ from: '--period-selector-list-element-padding', to: '--period-selector-preset-padding' },
			{ from: '--period-selector-list-element-border-radius', to: '--period-selector-preset-border-radius' },
			{ from: '--period-selector-list-element-font-size', to: '--period-selector-preset-font-size' }
		]
	},
	manual: [
		{
			id: 'period-selector-look',
			kind: 'review',
			summary:
				'One view with the presets in a column, a month and the start and end dates, instead of a list that slid to a detail view with "Back".',
			action: 'Usually nothing to do. Pass `months={2}` for two months side by side, `compact` to force the phone layout (presets as chips).'
		},
		...periodManual('period-selector')
	],
	added: [
		'`from` and `to` in `onchange`.',
		'`months`, `compact`, `min`, `max`, `weekStart`, `rollingLabel`, `presetSnippet`, `actionsSnippet`.',
		'`bind:periodSelectorElement`, `class` and native attributes; `data-compact`, `data-view`; every `--period-selector-*` variable.'
	]
} satisfies ComponentMigration;
