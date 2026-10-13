import { addDays, addMonths, makeDate, toISODate } from '../../dates.js';
import type FilterBuilder from '../builder.js';
import type { FilterPeriod, FilterRelative, FilterTimeUnit } from '../model.js';
import type { Context } from './units.js';

export function startOf(day: Date): Date {
	return makeDate(day.getFullYear(), day.getMonth(), day.getDate());
}

export function endOf(day: Date): Date {
	const end = startOf(day);
	end.setHours(23, 59, 59, 999);
	return end;
}

export function parseDatetime(text: unknown): Date | undefined {
	if (typeof text !== 'string') return undefined;
	const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(text);
	if (!match) return undefined;
	const date = makeDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	date.setHours(Number(match[4]), Number(match[5]), 0, 0);
	return date;
}

export function relativeOf(value: unknown): FilterRelative | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) return { amount: value, unit: 'days' };
	if (value && typeof value === 'object' && typeof (value as FilterRelative).amount === 'number')
		return value as FilterRelative;
	return undefined;
}

export function shift(date: Date, amount: number, unit: FilterTimeUnit): Date {
	if (unit === 'minutes') return new Date(date.getTime() + amount * 60_000);
	if (unit === 'hours') return new Date(date.getTime() + amount * 3_600_000);
	if (unit === 'weeks') return addDays(date, amount * 7);
	if (unit === 'months') return addMonths(date, amount);
	if (unit === 'years') return addMonths(date, amount * 12);
	return addDays(date, amount);
}

export function periodRange(period: FilterPeriod, context: Context): [Date, Date] | undefined {
	const today = startOf(context.now);
	const year = today.getFullYear();
	const month = today.getMonth();
	const weekStart = addDays(today, -((today.getDay() - context.weekStart + 7) % 7));
	const quarter = Math.floor(month / 3) * 3;
	switch (period) {
		case 'today':
			return [today, today];
		case 'yesterday':
			return [addDays(today, -1), addDays(today, -1)];
		case 'tomorrow':
			return [addDays(today, 1), addDays(today, 1)];
		case 'thisWeek':
			return [weekStart, addDays(weekStart, 6)];
		case 'lastWeek':
			return [addDays(weekStart, -7), addDays(weekStart, -1)];
		case 'nextWeek':
			return [addDays(weekStart, 7), addDays(weekStart, 13)];
		case 'thisMonth':
			return [makeDate(year, month, 1), makeDate(year, month + 1, 0)];
		case 'lastMonth':
			return [makeDate(year, month - 1, 1), makeDate(year, month, 0)];
		case 'nextMonth':
			return [makeDate(year, month + 1, 1), makeDate(year, month + 2, 0)];
		case 'monthToDate':
			return [makeDate(year, month, 1), today];
		case 'thisQuarter':
			return [makeDate(year, quarter, 1), makeDate(year, quarter + 3, 0)];
		case 'lastQuarter':
			return [makeDate(year, quarter - 3, 1), makeDate(year, quarter, 0)];
		case 'nextQuarter':
			return [makeDate(year, quarter + 3, 1), makeDate(year, quarter + 6, 0)];
		case 'quarterToDate':
			return [makeDate(year, quarter, 1), today];
		case 'thisYear':
			return [makeDate(year, 0, 1), makeDate(year, 11, 31)];
		case 'lastYear':
			return [makeDate(year - 1, 0, 1), makeDate(year - 1, 11, 31)];
		case 'nextYear':
			return [makeDate(year + 1, 0, 1), makeDate(year + 1, 11, 31)];
		case 'yearToDate':
			return [makeDate(year, 0, 1), today];
	}
	return undefined;
}

export function dayBound(day: Date, edge: 'start' | 'end', dateOnly: boolean): Date | string {
	if (dateOnly) return toISODate(day);
	return edge === 'start' ? startOf(day) : endOf(day);
}

export function dateRange(
	builder: FilterBuilder,
	column: string,
	dateOnly: boolean,
	from: Date | undefined,
	to: Date | undefined
): void {
	if (from) builder.where(column, '>=', dayBound(from, 'start', dateOnly));
	if (to) builder.where(column, '<=', dayBound(to, 'end', dateOnly));
}
