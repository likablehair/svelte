import type { ComponentMigration, CssVarRules, Removal } from '../types.js';
import { dayClick, forwarded } from './Calendar.js';

const calendar = forwarded('date-picker', ['calendar-outside-days', 'calendar-range', 'calendar-keyboard']);

const header = (name: string, note: string): Removal[] => [
	{ name: `--date-picker-${name}`, note },
	{ name: `--date-picker-default-${name}`, note }
];

const cssVars = {
	removed: [
		...header(
			'height',
			'The height follows the content (title row and 6 weeks); the month and year views keep the height of the day view. v4 default `400px`. Drop it; to change the size of the days use `--calendar-day-height`.'
		),
		...header('overflow', 'The panel no longer clips its content: drop it.'),
		...header(
			'header-background-color',
			'The colored header with the year and the chosen date is gone. Drop it.'
		),
		...header(
			'header-color',
			'The colored header is gone. Do not move the value to `--date-picker-title-color`: the title sits on the panel surface and text meant for a primary background would be unreadable. Apps paired it with `--calendar-selected-day-color` (`primary-foreground`): drop both.'
		),
		{
			name: '--date-picker-default-primary-color',
			note: 'v4 defined it but never read it. Drop it.'
		}
	],
	changed: [
		{
			name: '--date-picker-width',
			note: 'Width of the panel; default `280px` (v4: `100%` of the parent). The panel has its own surface now: padding, border, radius, background and shadow (`--date-picker-padding`, `-border-*`, `-border-radius`, `-background`).'
		},
		{
			name: '--date-picker-default-width',
			note: 'v4 `100%`, v5 `280px`.'
		},
		{
			name: '--date-picker-box-shadow',
			note: 'Same meaning; default `var(--global-shadow-lg)` with a border (v4: a light shadow and no border).'
		},
		{
			name: '--date-picker-default-box-shadow',
			note: 'Default `var(--global-shadow-lg)`; the v4 value used v4 color tokens.'
		}
	]
} satisfies CssVarRules;

export function forwardedDatePicker() {
	return [
		...cssVars.removed.map(
			(r): Removal => ({ ...r, note: `Gone from the inner DatePicker. ${r.note}` })
		),
		...calendar.cssVars
	];
}

export const pickerChangedVars = [
	...cssVars.changed.map((c) => c.name),
	...calendar.changed
];

export default {
	from: 'DatePicker',
	to: 'DatePicker',
	props: {
		renamed: [
			{
				from: 'type',
				to: 'range',
				note: 'A boolean now: see `props.values`. A dynamic `type={t}` → `range={t === "dateRange"}`.'
			}
		],
		removed: [
			{
				name: 'selectedYear',
				note: 'v4 wrote the year chosen in the year view here, not linked to the date. Use `bind:visibleYear` (the year shown) or read the year of `selectedDate`. See `date-picker-navigation`.',
				replacement: 'visibleYear'
			},
			{
				name: 'selectedMonth',
				note: 'v4 wrote the month chosen in the month view here, not linked to the date. Use `bind:visibleMonth` (the month shown, 0 to 11) or read the month of `selectedDate`. See `date-picker-navigation`.',
				replacement: 'visibleMonth'
			},
			{
				name: 'selectableYears',
				note: 'The years come from `min` and `max` (`Date`s, default years 1900–2100), which also disable the days, months and arrows outside them: `selectableYears={years}` → `min={new Date(first, 0, 1)} max={new Date(last, 11, 31)}`. Drop it when it only listed a wide span. A list with holes has no equivalent: use `isDateDisabled`. See `date-picker-years`.'
			},
			{
				name: 'skipTabs',
				note: 'Each view is a single Tab stop (the grid), and the title and arrows are buttons with accessible names. Drop it.'
			}
		],
		changed: [
			{
				name: 'view',
				note: 'Now bindable (`bind:view`), and it follows the navigation: clicking the title goes day → month → year → day, choosing a year shows its months, choosing a month its days. v4 read it only at mount. Default `undefined`, which shows the days.'
			},
			{
				name: 'disabled',
				note: 'Disables everything: title, arrows and grids (v4: only clicks on days).'
			},
			{
				name: 'class',
				note: 'Still an object of classes per part, with other keys: `container` unchanged; `selectorRow` (the row with the arrows) → `header`; v4 `header` (the colored band) is gone; new `title` (the title button) and `calendar` (the Calendar grid).'
			},
			{
				name: 'visibleMonth',
				note: 'Still bindable. The default is the month of `selectedDate` (v4: `selectedMonth`, the current month), and it follows `selectedDate` when that moves to another month.'
			},
			{
				name: 'visibleYear',
				note: 'Still bindable. The default is the year of `selectedDate` (v4: `selectedYear`, the current year). The arrows are limited by `min` / `max` (v4: by `selectableYears`).'
			}
		],
		defaults: [
			{
				name: 'locale',
				v4: "'it'",
				v5: "'en'",
				keepV4: 'locale="it"',
				note: 'Without it the title, the month and day names are English and the week starts on Sunday. Add `locale="it"` to every usage that omits it, unless the app wants English.'
			},
			{
				name: 'weekdayFormat',
				v4: "'narrow'",
				v5: "'short'",
				keepV4: 'weekdayFormat="narrow"',
				note: 'v4 had no prop and showed one letter per day; v5 shows short names. Add it only where the one-letter look matters.'
			}
		],
		values: [
			{
				name: 'range',
				values: { dateRange: 'true', singleDate: 'false' },
				note: 'For values that came from `type`: `type="dateRange"` → `range`, `type="singleDate"` → drop the attribute.'
			}
		],
		types: [
			{
				name: 'locale',
				v4: "'it' | 'en'",
				v5: 'string (BCP 47)',
				note: 'Any locale `Intl` knows; names and the first day of the week come from it.'
			}
		]
	},
	events: {
		changed: [dayClick],
		removed: [
			{
				name: 'onyearClick',
				note: 'Choosing a year now shows its months without changing the date. Bind `visibleYear` (and `view`) and react to them instead of `e.detail.year`. See `date-picker-navigation`.'
			},
			{
				name: 'onmonthClick',
				note: 'Choosing a month now shows its days without changing the date. Bind `visibleMonth` (and `view`) and react to them instead of `e.detail.month`. See `date-picker-navigation`.'
			}
		]
	},
	snippets: {
		removed: [
			{
				name: 'headerLabelSnippet',
				note: 'The header with the chosen date is gone. `titleSnippet({ title, month, year, view })` replaces the month title between the arrows; show the chosen date outside the picker if the screen needs it.',
				replacement: 'titleSnippet'
			}
		]
	},
	cssVars: {
		removed: [...cssVars.removed, ...calendar.cssVars],
		changed: cssVars.changed
	},
	manual: [
		{
			id: 'date-picker-look',
			summary:
				'The panel is a title ("October 2026") between two arrows above the grid, on a popup surface 280px wide (border, radius, padding, shadow); the colored header with the year and the chosen date is gone and the height follows the content (v4: `100%` wide, 400px high).',
			action:
				'Drop `--date-picker-height` and the `--date-picker-header-*` variables. Set `--date-picker-width` where the v4 width mattered. Inside an app card that already draws a surface, set `--date-picker-border-width="0px"`, `--date-picker-box-shadow="none"` and `--date-picker-background="transparent"`.'
		},
		{
			id: 'date-picker-navigation',
			summary:
				'Clicking the title goes from days to months to years and back; choosing a year shows its months and choosing a month its days, and neither changes the date. v4 had a year button in the header, wrote the choices to `selectedYear` / `selectedMonth` and reported them with `onyearClick` / `onmonthClick`.',
			action:
				'Replace `bind:selectedYear` / `bind:selectedMonth` and the `onyearClick` / `onmonthClick` handlers with `bind:visibleYear`, `bind:visibleMonth` and `bind:view`, read in a `$derived` or `$effect` where something must react.',
			when: {
				props: ['selectedYear', 'selectedMonth', 'view'],
				events: ['onyearClick', 'onmonthClick']
			}
		},
		{
			id: 'date-picker-years',
			summary:
				'The year view is a scrolling 4-column grid of every year from `min` to `max` (default 1900–2100), centered on the chosen one; v4 listed `selectableYears` (default the 75 years before and after the current one) and limited the arrows to them.',
			action:
				'Turn `selectableYears` into `min` / `max` dates (they also disable the days outside them), or drop it when it only listed a wide span.',
			when: { props: ['selectableYears'] }
		},
		{
			id: 'date-picker-labels',
			summary:
				'The arrows have English accessible names (`previousMonthLabel`, `nextMonthLabel`, `previousYearLabel`, `nextYearLabel`) and all the buttons are `type="button"` (v4 header buttons submitted the forms they were in).',
			action:
				'Pass the labels in the app language, e.g. `previousMonthLabel="Mese precedente"` and `nextMonthLabel="Mese successivo"`, where the app is Italian.'
		},
		{
			id: 'date-picker-calendar-variables',
			summary:
				'`--calendar-*` variables set on a DatePicker still reach its grid. The renamed and removed ones are listed in `cssVars.removed`; the others keep their name with the meaning described in the Calendar rules.',
			action:
				'Apply the Calendar rules to them. `--calendar-selected-day-color` set to the text color on primary can be dropped; `--calendar-day-height` needs a length.',
			when: { cssVars: calendar.changed }
		},
		{
			id: 'date-picker-markup',
			summary:
				'Markup and classes changed: `.date-picker-container`, `.header`, `.selector-row`, `.selector-text`, `button.year`, `button.day` → `.aurora-date-picker` (`data-view`, `data-disabled`), `.aurora-date-picker-header`, `.aurora-date-picker-title`; the grids are `.aurora-calendar`, `.aurora-month-selector`, `.aurora-year-selector`.',
			action:
				'Rewrite app `:global(...)` selectors that target the v4 classes, or replace them with `--date-picker-*` variables and `class.header` / `class.title`.',
			scope: 'app'
		},
		...calendar.manual
	],
	added: [
		'`min`, `max`, `isDateDisabled`, `weekStart`, `weekdayFormat`, `showOutsideDays`, `showWeekdays` (from Calendar).',
		'`titleSnippet`, `daySnippet`, `dayAppendSnippet`, `weekdaySnippet`.',
		'`onchange({ selectedDate, selectedDateTo })`.',
		'`previousMonthLabel`, `nextMonthLabel`, `previousYearLabel`, `nextYearLabel`.',
		'`focus()` method, `bind:datePickerElement`, native attributes on the panel, `data-view` and `data-disabled`.',
		'`--date-picker-*` variables for padding, gap, background, color, border and the title.'
	]
} satisfies ComponentMigration;
