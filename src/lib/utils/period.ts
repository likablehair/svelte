import { addDays, addMonths, dayKey, makeDate, parseISODate, startOfDay } from './dates.js';
import { libraryTexts } from './texts.js';

/** The presets that `PeriodPicker` offers by default, and the only ones the app backends understand. */
export type PeriodQuickValue =
	| 'today'
	| 'this-week'
	| 'this-month'
	| 'last-3month'
	| 'last-6month'
	| 'this-year'
	| 'total';

/** A period relative to today, such as "last 3 months" or "next 2 weeks". */
export type PeriodRolling = {
	/** How many units, a whole number from 1. */
	numberOfUnits?: number;
	/** Unit of `numberOfUnits`. */
	measurementUnit?: 'days' | 'weeks' | 'months' | 'years';
	/** `last` goes back from today, `next` forward. */
	direction?: 'last' | 'next';
};

/** Two chosen days, both included. One of them can be missing for an open range. */
export type PeriodDates = {
	/** First day. A `Date` at local midnight; a string is read as an ISO date or timestamp (what a JSON round trip gives back). */
	from?: Date | string;
	/** Last day, included. Same formats as `from`. */
	to?: Date | string;
};

/**
 * The value of `PeriodPicker` and `PeriodSelector`, as saved by the app backends: a preset
 * (`quick`), a period relative to today (`rolling`) or two days (`picker`). The same JSON shape as
 * v4. `T` is the type of the preset values, `PeriodQuickValue` unless the app passes its own presets.
 */
export type TimespanSettings<T extends string = PeriodQuickValue> =
	| { method?: 'quick'; values?: T }
	| { method?: 'rolling'; values?: PeriodRolling }
	| { method?: 'picker'; values?: PeriodDates };

/** A preset of `PeriodPicker` and `PeriodSelector`. */
export type PeriodPreset<T extends string = PeriodQuickValue> = {
	/** Value saved in `timespanSettings.values`. */
	value: T;
	/** Text of the preset in the list and in the field. */
	label: string;
	/** First and last day of the preset for a given `now`, both included; `undefined` for an open end. Needed for presets other than the default ones, which the library already knows. */
	range?: (now: Date) => [Date | undefined, Date | undefined];
};

/** The days a period covers: `from` and `to` at local midnight, both included. A missing one is an open end (`total` has neither). */
export type PeriodRange = { from?: Date; to?: Date };

/** Options of `resolvePeriod`. */
export type ResolvePeriodOptions<T extends string = PeriodQuickValue> = {
	/** The moment "today" refers to. Defaults to now. */
	now?: Date;
	/** First day of the week for `this-week`, from 0 (Sunday) to 6. Defaults to 1 (Monday), as the backends. */
	weekStart?: number;
	/** Presets other than the default ones, with their `range`. */
	presets?: PeriodPreset<T>[];
};

export const QUICK_VALUES: PeriodQuickValue[] = [
	'today',
	'this-week',
	'this-month',
	'last-3month',
	'last-6month',
	'this-year',
	'total'
];

export function sameRange(a: PeriodRange | undefined, b: PeriodRange | undefined): boolean {
	if (!a?.from || !a.to || !b?.from || !b.to) return false;
	return dayKey(a.from) === dayKey(b.from) && dayKey(a.to) === dayKey(b.to);
}

export function toDay(value: Date | string | undefined): Date | undefined {
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : startOfDay(value);
	if (typeof value !== 'string' || !value.trim()) return undefined;
	if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return parseISODate(value);
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : startOfDay(date);
}

function quickRange(value: string, today: Date, weekStart: number): PeriodRange | undefined {
	const year = today.getFullYear();
	const month = today.getMonth();
	switch (value) {
		case 'today':
			return { from: today, to: today };
		case 'this-week': {
			const start = addDays(today, -((today.getDay() - weekStart + 7) % 7));
			return { from: start, to: addDays(start, 6) };
		}
		case 'this-month':
			return { from: makeDate(year, month, 1), to: makeDate(year, month + 1, 0) };
		case 'last-3month':
			return { from: addDays(addMonths(today, -3), 1), to: today };
		case 'last-6month':
			return { from: addDays(addMonths(today, -6), 1), to: today };
		case 'this-year':
			return { from: makeDate(year, 0, 1), to: makeDate(year, 11, 31) };
		case 'total':
			return {};
	}
	return undefined;
}

function shiftBy(date: Date, amount: number, unit: NonNullable<PeriodRolling['measurementUnit']>): Date {
	if (unit === 'weeks') return addDays(date, amount * 7);
	if (unit === 'months') return addMonths(date, amount);
	if (unit === 'years') return addMonths(date, amount * 12);
	return addDays(date, amount);
}

export function validRolling(rolling: PeriodRolling | undefined): rolling is Required<PeriodRolling> {
	return (
		!!rolling &&
		Number.isInteger(rolling.numberOfUnits) &&
		(rolling.numberOfUnits ?? 0) >= 1 &&
		['days', 'weeks', 'months', 'years'].includes(rolling.measurementUnit ?? '') &&
		(rolling.direction === 'last' || rolling.direction === 'next')
	);
}

/**
 * Turns a period into its days: `this-month` and `this-year` run to the end of the month or year,
 * `this-week` starts on Monday, `last-3month` and `last-6month` are exactly 3 or 6 months counting
 * today. A `rolling` period counts today too: "last 7 days" are today and the 6 days before, "next
 * 2 weeks" are today and the 13 days after. Returns `undefined` when the value is missing or
 * incomplete, and an empty range for `total`.
 */
export function resolvePeriod<T extends string = PeriodQuickValue>(
	value: TimespanSettings<T> | undefined,
	options: ResolvePeriodOptions<T> = {}
): PeriodRange | undefined {
	if (!value?.method || value.values === undefined) return undefined;
	const now = options.now ?? new Date();
	const today = startOfDay(now);
	if (value.method === 'quick') {
		const preset = options.presets?.find((item) => item.value === value.values);
		if (preset?.range) {
			const [from, to] = preset.range(now);
			return { from: from && startOfDay(from), to: to && startOfDay(to) };
		}
		return quickRange(value.values as string, today, options.weekStart ?? 1);
	}
	if (value.method === 'rolling') {
		const rolling = value.values as PeriodRolling;
		if (!validRolling(rolling)) return undefined;
		const { numberOfUnits, measurementUnit, direction } = rolling;
		return direction === 'last'
			? { from: addDays(shiftBy(today, -numberOfUnits, measurementUnit), 1), to: today }
			: { from: today, to: addDays(shiftBy(today, numberOfUnits, measurementUnit), -1) };
	}
	const dates = value.values as PeriodDates;
	const from = toDay(dates.from);
	const to = toDay(dates.to);
	if (!from && !to) return undefined;
	if (from && to && dayKey(to) < dayKey(from)) return { from: to, to: from };
	return { from, to };
}

function daysBetween(from: Date, to: Date): number {
	const utc = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
	return Math.round((utc(to) - utc(from)) / 86_400_000);
}

export function shiftRange(range: PeriodRange, direction: 1 | -1): PeriodRange | undefined {
	const { from, to } = range;
	if (!from || !to) return undefined;
	const lastOfMonth = makeDate(to.getFullYear(), to.getMonth() + 1, 0);
	if (from.getDate() === 1 && dayKey(to) === dayKey(lastOfMonth)) {
		const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1;
		const start = makeDate(from.getFullYear(), from.getMonth() + direction * months, 1);
		return { from: start, to: makeDate(start.getFullYear(), start.getMonth() + months, 0) };
	}
	const days = daysBetween(from, to) + 1;
	return { from: addDays(from, direction * days), to: addDays(to, direction * days) };
}

export function rangeDays(range: PeriodRange): number | undefined {
	if (!range.from || !range.to) return undefined;
	return daysBetween(range.from, range.to) + 1;
}

export function rollingText(rolling: PeriodRolling | undefined, locale: string): string {
	if (!validRolling(rolling)) return '';
	const texts = libraryTexts(locale).period;
	const one = new Intl.PluralRules(locale).select(rolling.numberOfUnits) === 'one';
	const group =
		rolling.direction === 'last' ? (one ? texts.lastOne : texts.last) : one ? texts.nextOne : texts.next;
	return group[rolling.measurementUnit].replace('{n}', String(rolling.numberOfUnits));
}

export function rangeText(range: PeriodRange | undefined, locale: string): string {
	if (!range || (!range.from && !range.to)) return '';
	const texts = libraryTexts(locale).period;
	const format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
	if (range.from && range.to) return format.formatRange(range.from, range.to);
	if (range.from) return texts.since.replace('{date}', format.format(range.from));
	return texts.until.replace('{date}', format.format(range.to!));
}

function capitalize(text: string, locale: string): string {
	return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

export function rangeName(range: PeriodRange | undefined, locale: string): string | undefined {
	const from = range?.from;
	const to = range?.to;
	if (!from || !to) return undefined;
	if (dayKey(from) === dayKey(to))
		return capitalize(
			new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(from),
			locale
		);
	const wholeMonths =
		from.getDate() === 1 && dayKey(to) === dayKey(makeDate(to.getFullYear(), to.getMonth() + 1, 0));
	if (!wholeMonths) return undefined;
	const months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1;
	if (months === 1)
		return capitalize(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(from), locale);
	if (months === 12 && from.getMonth() === 0)
		return new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(from);
	return undefined;
}
