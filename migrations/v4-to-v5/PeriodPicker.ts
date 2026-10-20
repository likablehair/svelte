import type { ComponentMigration, ManualStep, Removal } from '../types.js';

export const removedProps: Removal[] = [
	{
		name: 'lang',
		note: 'Texts, names of months and days and the date format now all come from `locale` (or `setDefaultLocale`). v4 formatted the field with `lang` and the calendar with `locale`, so English texts could show Italian days. Drop `lang` and keep or add `locale`.',
		replacement: 'locale'
	},
	{
		name: 'mode',
		note: "`mode=\"datepicker\"` turned presets into dates inside the value. The value now keeps the preset and `onchange` gives `from` and `to`; use them, or `resolvePeriod(value)`, where the app needed the dates."
	},
	{ name: 'valid', note: 'Never read by the apps. An incomplete period cannot be applied (Apply is disabled).' },
	{ name: 'isSelectionMode', note: 'Internal state of the v4 list/detail views, which no longer exist.' },
	{
		name: 'quickRangeConvertor',
		note: 'Give each app preset in `quickSelectOptions` a `range: (now) => [from, to]` instead.',
		replacement: 'quickSelectOptions[].range'
	}
];

export const periodManual = (prefix: string): ManualStep[] => [
	{
		id: `${prefix}-dates`,
		kind: 'review',
		summary:
			'The days of a period changed: `this-month` and `this-year` run to the end of the month or year and `this-week` starts on Monday (as the backends did); `last-3month` and `last-6month` are exactly 3 or 6 months counting today (the backends started on the first day of the month 2 or 5 months ago); a rolling period counts today, "last 7 days" are today and the 6 days before (v4 and the backends counted 8). v4 computed yet other days on the client.',
		action:
			'Remove local copies of `getDatesFromQuick` / `getDatesFromRolling` and use `from` and `to` from `onchange`, or `resolvePeriod(timespanSettings)` exported by the library. Replace `toISOString().slice(0, 10)` on these dates with `toISODate` (it moved the day back in Italy).'
	},
	{
		id: `${prefix}-backend-rolling`,
		kind: 'edit',
		summary:
			'Backends must resolve `rolling` periods and the `last-3month` / `last-6month` presets as the library does now, counting today, or the app and the server show different days.',
		action:
			'In the backend helpers that turn the value into dates (for example `getFiltersFromTimespanRollingMethod` and `getFiltersFromTimespanQuickMethod` with luxon): start "last N" at `today.minus(duration).plus({ days: 1 }).startOf("day")`, end "next N" at `today.plus(duration).minus({ days: 1 }).endOf("day")`, start `last-3month` at `today.minus({ months: 3 }).plus({ days: 1 }).startOf("day")` and `last-6month` at `today.minus({ months: 6 }).plus({ days: 1 }).startOf("day")`. Change them in the same release as the frontend. Widgets saved with these presets will start a few days earlier than before.',
		scope: 'app'
	},
	{
		id: `${prefix}-default-value`,
		kind: 'edit',
		summary: 'Without a value the component no longer writes `{}` into the bound variable when it mounts.',
		action:
			'Code that checked for `{}` must accept `undefined`. The `$effect` that many apps repeat to set `{ method: "quick", values: "total" }` can become the initial value of the `$state`.'
	}
];

export default {
	from: 'PeriodPicker',
	to: 'PeriodPicker',
	props: {
		removed: [
			...removedProps,
			{
				name: 'setTimespanLabel',
				note: 'Use `labelSnippet({ label, dates, from, to, timespanSettings })` to write the field differently.',
				replacement: 'labelSnippet'
			}
		],
		types: [
			{
				name: 'quickSelectOptions',
				v4: '{ value: T; label: string }[]',
				v5: 'PeriodPreset<T>[]',
				note: 'Same fields plus an optional `range`, needed by presets that are not among the 7 the library knows.'
			},
			{
				name: 'timespanSettings',
				v4: 'TimespanSettings<T> (not exported)',
				v5: 'TimespanSettings<T>',
				note: 'Same JSON shape, now exported: import it instead of deriving it with `ComponentProps` or copying it. `picker` dates may also be ISO strings.'
			}
		]
	},
	events: {
		changed: [
			{
				name: 'onchange',
				argument: {},
				type: '{ timespanSettings: TimespanSettings<T>; from?: Date; to?: Date }',
				note: 'Called only when the period is applied (a preset, Apply or an arrow), no longer at every click inside the menu. It also receives the days the period covers.'
			}
		]
	},
	cssVars: {
		renamed: [
			{
				from: '--simple-textfield-width',
				to: '--period-picker-width',
				note: 'Variables of the v4 inner text field, passed by the apps on the PeriodPicker: the field is now a bar of its own.'
			},
			{ from: '--simple-textfield-height', to: '--period-picker-height', note: 'Same as `--simple-textfield-width`.' },
			{
				from: '--simple-textfield-default-border-radius',
				to: '--period-picker-border-radius',
				note: 'Same as `--simple-textfield-width`.'
			},
			{ from: '--simple-textfield-default-padding', to: '--period-picker-padding', note: 'Same as `--simple-textfield-width`.' }
		],
		removed: [
			{
				name: '--simple-textfield-default-border',
				note: 'A shorthand: split it into `--period-picker-border-width` and `--period-picker-border-color`.',
				replacement: '--period-picker-border-color'
			}
		]
	},
	manual: [
		{
			id: 'period-picker-look',
			kind: 'review',
			summary:
				'The field is a bar with two arrows at the start that move the period, its name and its days (at least 300px wide); the menu shows presets, one month and the start and end dates instead of a list that slid to a detail view.',
			action:
				'Usually nothing to do. Pass `shiftable={false}` where moving the period makes no sense, `months={2}` for two months side by side, `--period-picker-width` for a fixed width. The field was a disabled text field in v4: remove workarounds for it (for example CSS that undid the disabled look).'
		},
		{
			id: 'period-picker-draft',
			kind: 'review',
			summary:
				'A custom range or a relative period is a draft until Apply; Cancel, Escape and a click outside discard it. Presets still apply at once and close.',
			action: 'Nothing to do unless the app reacted to every click inside the menu (no app on record does).'
		},
		...periodManual('period-picker'),
		{
			id: 'period-picker-local-copies',
			kind: 'review',
			summary:
				'Several apps use a local `$lib/components/common/PeriodPicker.svelte` with a different JSON (rolling as a number of days, `current-year`, `timespanMethod` with `pickerValues`...), read by their own backend.',
			action:
				'Leave those copies as they are: they do not use the library and their saved values are not the v4 shape. Move them to `PeriodPicker` only together with the backend that reads the values.',
			scope: 'app'
		}
	],
	added: [
		'Arrows that move the period back and forth (`shiftable`, `previousLabel`, `nextLabel`); a moved whole month or year is named after its dates ("August 2026"), and landing on the days of a preset goes back to it.',
		'`months={2}` for two months side by side in the menu.',
		'`from` and `to` in `onchange`; `resolvePeriod` and the `TimespanSettings`, `PeriodPreset`, `PeriodRange` types exported.',
		'Start and end dates typed with the mask of `locale`; open ranges.',
		'`placeholder`, `disabled`, `bind:open`, `placement`, `min`, `max`, `weekStart`, `onclose`.',
		'`applyLabel`, `cancelLabel`, `rollingLabel`; `labelSnippet` and `presetSnippet`.',
		'Bottom drawer with one month on screens up to 1024px wide.',
		'`bind:periodPickerElement`, `class` and native attributes; `data-open`, `data-disabled`, `data-empty`; every `--period-picker-*` and `--period-selector-*` variable.'
	]
} satisfies ComponentMigration;
