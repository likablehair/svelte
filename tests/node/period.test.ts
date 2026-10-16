import { describe, expect, test } from 'vitest';
import {
	rangeDays,
	rangeName,
	rangeText,
	resolvePeriod,
	rollingText,
	shiftRange,
	type PeriodRange,
	type TimespanSettings
} from '../../src/lib/utils/period.js';
import { toISODate } from '../../src/lib/utils/dates.js';

const NOW = new Date(2026, 8, 24, 15, 30);
const day = (year: number, month: number, date: number) => new Date(year, month - 1, date);
const iso = (range: PeriodRange | undefined) =>
	range && { from: range.from && toISODate(range.from), to: range.to && toISODate(range.to) };
const quick = (values: string, weekStart?: number) =>
	iso(resolvePeriod({ method: 'quick', values }, { now: NOW, weekStart }));

describe('resolvePeriod', () => {
	test('presets: whole month and year, last 3 and 6 months exactly, counting today', () => {
		expect(quick('today')).toEqual({ from: '2026-09-24', to: '2026-09-24' });
		expect(quick('this-week')).toEqual({ from: '2026-09-21', to: '2026-09-27' });
		expect(quick('this-month')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
		expect(quick('last-3month')).toEqual({ from: '2026-06-25', to: '2026-09-24' });
		expect(quick('last-6month')).toEqual({ from: '2026-03-25', to: '2026-09-24' });
		expect(quick('last-3month')).toEqual(
			iso(resolvePeriod({ method: 'rolling', values: { numberOfUnits: 3, measurementUnit: 'months', direction: 'last' } }, { now: NOW }))
		);
		expect(quick('this-year')).toEqual({ from: '2026-01-01', to: '2026-12-31' });
		expect(resolvePeriod({ method: 'quick', values: 'total' }, { now: NOW })).toEqual({});
	});

	test('this week starts on Monday unless weekStart says otherwise', () => {
		expect(quick('this-week', 0)).toEqual({ from: '2026-09-20', to: '2026-09-26' });
		const sunday = resolvePeriod({ method: 'quick', values: 'this-week' }, { now: day(2026, 9, 27) });
		expect(iso(sunday)).toEqual({ from: '2026-09-21', to: '2026-09-27' });
	});

	test('rolling periods count today: last 7 days are today and the 6 before', () => {
		const rolling = (values: object) => iso(resolvePeriod({ method: 'rolling', values } as TimespanSettings, { now: NOW }));
		expect(rolling({ numberOfUnits: 7, measurementUnit: 'days', direction: 'last' })).toEqual({
			from: '2026-09-18',
			to: '2026-09-24'
		});
		expect(rolling({ numberOfUnits: 2, measurementUnit: 'weeks', direction: 'next' })).toEqual({
			from: '2026-09-24',
			to: '2026-10-07'
		});
		expect(rolling({ numberOfUnits: 1, measurementUnit: 'years', direction: 'last' })).toEqual({
			from: '2025-09-25',
			to: '2026-09-24'
		});
		const endOfMonth = resolvePeriod(
			{ method: 'rolling', values: { numberOfUnits: 1, measurementUnit: 'months', direction: 'last' } },
			{ now: day(2026, 3, 31) }
		);
		expect(iso(endOfMonth)).toEqual({ from: '2026-03-01', to: '2026-03-31' });
		expect(rangeDays(resolvePeriod({ method: 'rolling', values: { numberOfUnits: 7, measurementUnit: 'days', direction: 'last' } }, { now: NOW })!)).toBe(7);
	});

	test('incomplete or invalid rolling values resolve to nothing', () => {
		for (const values of [
			{ numberOfUnits: 0, measurementUnit: 'days', direction: 'last' },
			{ numberOfUnits: 1.5, measurementUnit: 'days', direction: 'last' },
			{ numberOfUnits: 3, direction: 'last' },
			{ numberOfUnits: 3, measurementUnit: 'days' }
		])
			expect(resolvePeriod({ method: 'rolling', values } as TimespanSettings, { now: NOW })).toBeUndefined();
	});

	test('picker dates are local days, from Date, ISO date or the timestamp of a JSON round trip', () => {
		const local = day(2026, 9, 10);
		const values = JSON.parse(JSON.stringify({ from: local, to: day(2026, 9, 23) }));
		expect(iso(resolvePeriod({ method: 'picker', values }))).toEqual({ from: '2026-09-10', to: '2026-09-23' });
		expect(iso(resolvePeriod({ method: 'picker', values: { from: '2026-09-10', to: '2026-09-23' } }))).toEqual({
			from: '2026-09-10',
			to: '2026-09-23'
		});
		expect(iso(resolvePeriod({ method: 'picker', values: { from: day(2026, 9, 23), to: local } }))).toEqual({
			from: '2026-09-10',
			to: '2026-09-23'
		});
	});

	test('open ranges keep one end; no dates, no method or no values resolve to nothing', () => {
		expect(iso(resolvePeriod({ method: 'picker', values: { from: day(2026, 9, 1) } }))).toEqual({
			from: '2026-09-01',
			to: undefined
		});
		expect(resolvePeriod({ method: 'picker', values: {} })).toBeUndefined();
		expect(resolvePeriod({ method: 'quick' })).toBeUndefined();
		expect(resolvePeriod({} as TimespanSettings)).toBeUndefined();
		expect(resolvePeriod(undefined)).toBeUndefined();
	});

	test('app presets use their range; unknown presets without one resolve to nothing', () => {
		const presets = [
			{
				value: 'yesterday',
				label: 'Yesterday',
				range: (now: Date): [Date, Date] => [day(2026, 9, now.getDate() - 1), day(2026, 9, now.getDate() - 1)]
			}
		];
		expect(iso(resolvePeriod({ method: 'quick', values: 'yesterday' }, { now: NOW, presets }))).toEqual({
			from: '2026-09-23',
			to: '2026-09-23'
		});
		expect(resolvePeriod({ method: 'quick', values: 'someday' }, { now: NOW })).toBeUndefined();
	});
});

describe('shiftRange', () => {
	test('whole months move by their number of months', () => {
		const september = { from: day(2026, 9, 1), to: day(2026, 9, 30) };
		expect(iso(shiftRange(september, -1))).toEqual({ from: '2026-08-01', to: '2026-08-31' });
		expect(iso(shiftRange(september, 1))).toEqual({ from: '2026-10-01', to: '2026-10-31' });
		const quarter = { from: day(2026, 7, 1), to: day(2026, 9, 30) };
		expect(iso(shiftRange(quarter, -1))).toEqual({ from: '2026-04-01', to: '2026-06-30' });
		const year = { from: day(2026, 1, 1), to: day(2026, 12, 31) };
		expect(iso(shiftRange(year, 1))).toEqual({ from: '2027-01-01', to: '2027-12-31' });
	});

	test('other ranges move by their length in days; open ranges do not move', () => {
		const twoWeeks = { from: day(2026, 9, 10), to: day(2026, 9, 23) };
		expect(iso(shiftRange(twoWeeks, 1))).toEqual({ from: '2026-09-24', to: '2026-10-07' });
		expect(iso(shiftRange({ from: day(2026, 3, 28), to: day(2026, 3, 29) }, 1))).toEqual({
			from: '2026-03-30',
			to: '2026-03-31'
		});
		expect(shiftRange({ from: day(2026, 9, 10) }, 1)).toBeUndefined();
	});

	test('rangeDays counts both ends, across a daylight saving change', () => {
		expect(rangeDays({ from: day(2026, 3, 28), to: day(2026, 3, 30) })).toBe(3);
		expect(rangeDays({ from: day(2026, 9, 10) })).toBeUndefined();
	});
});

describe('texts', () => {
	test('rolling periods are named in the language of the locale, with plurals', () => {
		expect(rollingText({ numberOfUnits: 3, measurementUnit: 'months', direction: 'last' }, 'en')).toBe('Last 3 months');
		expect(rollingText({ numberOfUnits: 1, measurementUnit: 'weeks', direction: 'next' }, 'en')).toBe('Next week');
		expect(rollingText({ numberOfUnits: 2, measurementUnit: 'weeks', direction: 'last' }, 'it')).toBe('Ultime 2 settimane');
		expect(rollingText({ numberOfUnits: 1, measurementUnit: 'months', direction: 'last' }, 'it')).toBe('Ultimo mese');
		expect(rollingText({ numberOfUnits: 0, measurementUnit: 'months', direction: 'last' }, 'it')).toBe('');
	});

	test('ranges are written with Intl, open ranges with from and until', () => {
		const plain = (text: string) => text.replace(/\s/g, ' ');
		expect(plain(rangeText({ from: day(2026, 9, 10), to: day(2026, 9, 23) }, 'en'))).toBe('Sep 10 – 23, 2026');
		expect(plain(rangeText({ from: day(2026, 9, 1) }, 'it'))).toBe('Dal 1 set 2026');
		expect(plain(rangeText({ to: day(2026, 9, 30) }, 'en'))).toBe('Until Sep 30, 2026');
		expect(rangeText({}, 'en')).toBe('');
	});

	test('whole months, whole years and single days are named after their dates', () => {
		expect(rangeName({ from: day(2026, 8, 1), to: day(2026, 8, 31) }, 'en')).toBe('August 2026');
		expect(rangeName({ from: day(2026, 8, 1), to: day(2026, 8, 31) }, 'it')).toBe('Agosto 2026');
		expect(rangeName({ from: day(2025, 1, 1), to: day(2025, 12, 31) }, 'en')).toBe('2025');
		expect(rangeName({ from: day(2026, 9, 24), to: day(2026, 9, 24) }, 'en')).toBe('Thu, Sep 24, 2026');
		expect(rangeName({ from: day(2026, 7, 1), to: day(2026, 9, 30) }, 'en')).toBeUndefined();
		expect(rangeName({ from: day(2026, 9, 10), to: day(2026, 9, 23) }, 'en')).toBeUndefined();
		expect(rangeName({ from: day(2026, 9, 1) }, 'en')).toBeUndefined();
	});
});
