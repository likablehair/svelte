import type {
	ComponentMigration,
	CssVarRules,
	EventChange,
	ManualStep,
	Removal,
	Rename
} from '../types.js';

const both = (suffix: string, to: string, note?: string): Rename[] => [
	{ from: `--calendar-${suffix}`, to: `--calendar-${to}`, note },
	{ from: `--calendar-default-${suffix}`, to: `--calendar-default-${to}`, note }
];

const gone = (suffix: string, note: string, replacement?: string): Removal[] => [
	{ name: `--calendar-${suffix}`, note, replacement },
	{
		name: `--calendar-default-${suffix}`,
		note,
		replacement: replacement?.replaceAll('--calendar-', '--calendar-default-')
	}
];

const cssVars = {
	renamed: [
		...both(
			'grid-gap',
			'row-gap',
			'Space between the rows only: columns have no gap, so the range band stays continuous. v4 default `0px`, v5 `2px`.'
		),
		...both(
			'day-background-color',
			'day-background',
			'Background of the day highlight behind the number (v4 read it but never defined a default).'
		),
		...both('day-hover-background-color', 'day-hover-background'),
		...both('selected-day-background-color', 'selected-day-background'),
		...both(
			'today-background-color',
			'today-background',
			'v4 drew a pale red circle behind the number of today; v5 fills the day highlight (transparent by default, radius `--calendar-day-border-radius`) and marks today with a dot (`--calendar-today-dot-color`, `--calendar-today-dot-size`). Drop the override unless today must be filled.'
		),
		...both(
			'between-range-background-color',
			'range-background',
			'The band now also runs behind the two ends of the range and fills the whole cell.'
		),
		...both('between-range-color', 'range-color')
	],
	removed: [
		...gone(
			'height',
			'The height follows the content: the weekday row plus 6 rows of `--calendar-day-height` with `--calendar-row-gap`. To fill a given height, size the rows with `--calendar-day-height`.',
			'--calendar-day-height'
		),
		...gone(
			'day-hover-border-radius',
			'Hover uses the radius of every day state.',
			'--calendar-day-border-radius'
		),
		...gone(
			'selected-day-border-radius',
			'The selected day uses the radius of every day state.',
			'--calendar-day-border-radius'
		),
		...gone(
			'today-border-radius',
			'Today has no circle of its own any more: it is marked by a dot (`--calendar-today-dot-size`, `--calendar-today-dot-color`), and `--calendar-today-background` fills the day highlight with `--calendar-day-border-radius`.'
		),
		...gone(
			'today-height',
			'Today has no circle of its own any more: the mark is a dot, sized by `--calendar-today-dot-size`.'
		),
		...gone(
			'range-start-border-radius',
			'The ends of a range are selected days (`--calendar-day-border-radius`) with the band behind them; v4 squared their inner corners. Drop the override.'
		),
		...gone(
			'range-end-border-radius',
			'The ends of a range are selected days (`--calendar-day-border-radius`) with the band behind them; v4 squared their inner corners. Drop the override.'
		)
	],
	changed: [
		{
			name: '--calendar-day-height',
			note: 'Height of each row of days. v4 default `100%` of a row stretched by `--calendar-height`; v5 `32px`. A percentage no longer works: use a length.'
		},
		{
			name: '--calendar-default-day-height',
			note: 'v4 `100%`, v5 `32px`: use a length.'
		},
		{
			name: '--calendar-day-border-radius',
			note: 'Radius of every day highlight now (hover, selected, today, ends of the range band); v4 default `0px`, with separate radii for hover, selected day and range ends. Default `var(--global-radius-sm)`.'
		},
		{
			name: '--calendar-default-day-border-radius',
			note: 'Radius of every day state now; v4 `0px`, v5 `var(--global-radius-sm)`.'
		},
		{
			name: '--calendar-selected-day-color',
			note: 'Same meaning, text of the selected day. The default is `var(--global-color-on-primary)`: apps passed `rgb(var(--global-color-primary-foreground))` to get the text color on primary, which the default already is. Drop it.'
		},
		{
			name: '--calendar-default-selected-day-color',
			note: 'Same meaning; default `var(--global-color-on-primary)`.'
		},
		{
			name: '--calendar-today-color',
			note: 'Text of today; default `inherit` (v4: contrast-800 over a pale red circle).'
		},
		{
			name: '--calendar-default-today-color',
			note: 'Default `inherit` (v4: contrast-800).'
		}
	]
} satisfies CssVarRules;

export const dayClick: EventChange = {
	name: 'ondayClick',
	argument: {
		'detail.dateStat.dayOfMonth': 'date.getDate()',
		'detail.dateStat.month': 'date.getMonth()',
		'detail.dateStat.year': 'date.getFullYear()',
		'detail.dateStat.dayOfWeek': null,
		'detail.dateStat': null,
		'detail.extraMonth': 'outside',
		'detail.selected': null,
		detail: ''
	},
	type: '{ date: Date; outside: boolean; nativeEvent: MouseEvent | KeyboardEvent }',
	note: '`dateStat` became `date`, a `Date` at local midnight: `dateStat.dayOfMonth` → `date.getDate()`, `.month` → `date.getMonth()`, `.year` → `date.getFullYear()`, `new Date(s.year, s.month, s.dayOfMonth)` → `date`. v4 `dayOfWeek` was the column index (Monday = 0 with `it`, Sunday = 0 with `en`), not the weekday: `(date.getDay() + 6) % 7` for a Monday-first column, `date.getDay()` for the weekday. `selected` was always `!extraMonth`: use `!outside`. Called after the selection changed, only for days that can be chosen (never while `disabled`), also with Enter and Space. To follow the value, `onchange({ selectedDate, selectedDateTo })` or `bind:selectedDate` is simpler.'
};

const manual: ManualStep[] = [
	{
		id: 'calendar-outside-days',
		summary:
			'Days of the previous and next month can be chosen: a click selects the day and shows its month. v4 ignored the click (only `ondayClick` fired), and with `showExtraMonthDays={false}` the hidden cells still took clicks.',
		action:
			'Where outside days must stay inert, pass `showOutsideDays={false}` (the cells are empty) or limit the days with `min` / `max` / `isDateDisabled`. Handlers that tested `extraMonth` to ignore those clicks can drop the test.'
	},
	{
		id: 'calendar-range',
		summary:
			'With `range` the same day clicked twice is a one-day range (`selectedDateTo` equals `selectedDate`; v4 ignored the second click), the third click starts a new range, and hovering or focusing a day previews the band.',
		action:
			'Check code that treats `selectedDate` equal to `selectedDateTo` as impossible, or expected the second click on the start day to do nothing.',
		when: { props: ['type'] }
	},
	{
		id: 'calendar-keyboard',
		summary:
			'It is an ARIA grid: one Tab stop, arrows move by day and week, Home and End to the ends of the week, Page Up and Page Down change month (with Shift, year), Enter and Space choose; screen readers read the full date of each day and the grid is named by the month. v4 cells were not focusable.',
		action:
			'End-to-end tests that clicked a `.day-slot` by its number should use `getByRole("gridcell", { name: <full date> })` (the name comes from `Intl` in `locale`). With a visible title next to the grid, point `aria-labelledby` at it.'
	},
	{
		id: 'calendar-look',
		summary:
			'Always 6 rows of 32px days (v4: only the rows needed, stretched to `--calendar-height`, 100% of the parent); short weekday names ("Mon", v4 one bold letter); today marked by a dot (v4: pale red circle); the selected day a primary fill; outside days at 50% opacity (v4: 30%); the range a continuous band; the new month slides in.',
		action:
			'Calendars sized by their parent height (widgets) need `--calendar-day-height` instead. Add `weekdayFormat="narrow"` for one letter. `variant="grid"` is the large agenda grid.'
	},
	{
		id: 'calendar-markup',
		summary:
			'Markup and classes changed: `.calendar-container`, `.grid-layout`, `.week-header-slot`, `.day-slot`, `.extra-month`, `.today`, `.selected`, `.between-range`, `.range-start`, `.range-end`, `.hovered` → `.aurora-calendar` (`role="grid"`), `.aurora-calendar-weekday`, `.aurora-calendar-day` (`role="gridcell"`) with `[data-outside]`, `[data-today]`, `[data-selected]`, `[data-range="start|middle|end|single"]`, `[data-preview]`, `[data-disabled]`; the number is in `.aurora-calendar-day-content`.',
		action:
			'Rewrite app `:global(...)` selectors that target the v4 classes, or replace them with `--calendar-*` variables.',
		scope: 'app'
	}
];

export function forwarded(prefix: string, ids: string[]) {
	return {
		cssVars: [
			...cssVars.renamed.map(
				(r): Removal => ({
					name: r.from,
					note: r.note
						? `Renamed in the inner Calendar, where it still applies. ${r.note}`
						: 'Renamed in the inner Calendar, where it still applies.',
					replacement: r.to
				})
			),
			...cssVars.removed.map((r): Removal => ({ ...r, note: `Gone from the inner Calendar. ${r.note}` }))
		],
		changed: cssVars.changed.map((c) => c.name),
		manual: manual
			.filter((step) => ids.includes(step.id))
			.map((step) => ({ ...step, id: step.id.replace(/^calendar-/, `${prefix}-`) }))
	};
}

export default {
	from: 'Calendar',
	to: 'Calendar',
	props: {
		renamed: [
			{
				from: 'type',
				to: 'range',
				note: 'A boolean now: see `props.values`. A dynamic `type={t}` → `range={t === "dateRange"}`.'
			},
			{
				from: 'showExtraMonthDays',
				to: 'showOutsideDays',
				note: 'With `false` the hidden days are empty cells; v4 kept them clickable.'
			},
			{ from: 'showHeader', to: 'showWeekdays' }
		],
		toCssVar: [
			{
				name: 'animationDuration',
				cssVar: '--calendar-duration',
				note: 'A CSS time: `animationDuration={300}` → `--calendar-duration="300ms"`. Default `var(--global-duration)`. The new month slides in once (v4: the old one flew out, then the new one in after the same delay), and the animation stops with reduced motion.'
			}
		],
		changed: [
			{
				name: 'visibleMonth',
				note: 'Still bindable, 0 to 11. The default is the month of `selectedDate` (v4: the current month), and it now follows `selectedDate` when that moves to another month or an outside day is clicked.'
			},
			{
				name: 'visibleYear',
				note: 'Still bindable. The default is the year of `selectedDate` (v4: the current year), and it follows `selectedDate` like `visibleMonth`.'
			},
			{
				name: 'disabled',
				note: 'Same meaning; the grid also leaves the Tab order and sets `aria-disabled`.'
			},
			{
				name: 'class',
				note: 'Still an object of classes per part: `container` (the grid) and `day` unchanged, `weekHeader` → `weekday`.'
			}
		],
		defaults: [
			{
				name: 'locale',
				v4: "'it'",
				v5: "'en'",
				keepV4: 'locale="it"',
				note: 'Without it the month and day names are English and the week starts on Sunday. Add `locale="it"` to every usage that omits it, unless the app wants English.'
			},
			{
				name: 'weekdayFormat',
				v4: "'narrow'",
				v5: "'short'",
				keepV4: 'weekdayFormat="narrow"',
				note: 'v4 had no prop and showed the first letter of each day ("L M M G V S D"); v5 shows short names ("Lun", "Mon"). Add it only where the one-letter look matters.'
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
				note: 'Any locale `Intl` knows (`it-IT`, `en-GB`, `de`): names and the first day of the week come from it; `weekStart` overrides the latter.'
			}
		]
	},
	events: {
		changed: [dayClick]
	},
	snippets: {
		renamed: [
			{
				from: 'weekHeaderSnippet',
				to: 'weekdaySnippet',
				note: 'The parameters change too: see `snippets.parameters`.'
			}
		],
		parameters: [
			{
				name: 'weekdaySnippet',
				v4: '{ header: string; index: number }',
				v5: '{ label: string; name: string; day: number }',
				note: '`header` (first letter) → `label` (in `weekdayFormat`) or `name` (full name). `index` was the column; `day` is the weekday, 0 Sunday to 6 Saturday: the column is `(day - weekStart + 7) % 7`. The cell around it keeps its role and accessible name.'
			},
			{
				name: 'daySnippet',
				v4: '{ dayStat: DateStat; extraMonth: boolean; selected: boolean }',
				v5: 'CalendarDay { date; outside; selected; inRange; today; disabled }',
				note: 'Destructure `{ date, outside, selected }`: `dayStat.dayOfMonth` → `date.getDate()`, `extraMonth` → `outside`. It replaces only the number: the cell keeps click, keyboard, state and the full date for screen readers. Import `type CalendarDay` from the package root.'
			}
		]
	},
	cssVars,
	manual,
	added: [
		'`min`, `max`, `isDateDisabled` (days that cannot be chosen).',
		'`weekStart`, `weekdayFormat`; `locale` takes any BCP 47 tag.',
		'`variant="grid"` (agenda cells) and `dayAppendSnippet` for events or marks.',
		'`onchange({ selectedDate, selectedDateTo })`.',
		'`focus()` method, `bind:calendarElement`, native attributes on the grid.',
		'`data-variant`, `data-disabled` on the grid; `data-today`, `data-selected`, `data-outside`, `data-disabled`, `data-range` on the days.',
		'`--calendar-*` variables for colors, font, weekdays, today dot, range preview, outside and disabled opacity, focus ring, duration, easing and the grid variant.'
	]
} satisfies ComponentMigration;
