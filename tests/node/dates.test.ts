import { afterEach, describe, expect, test } from 'vitest';
import {
	addDays,
	addMonths,
	dayKey,
	formatDate,
	formatOf,
	makeDate,
	maskDate,
	maskInput,
	monthGrid,
	monthNames,
	monthTitle,
	outOfBounds,
	parseDate,
	parseFormat,
	parseISODate,
	sameDay,
	startOfDay,
	toISODate,
	weekdayNames,
	weekStartOf
} from '../../src/lib/utils/dates.js';

const initialTimeZone = process.env.TZ;

function inTimeZone(timeZone: string) {
	process.env.TZ = timeZone;
}

afterEach(() => {
	if (initialTimeZone === undefined) delete process.env.TZ;
	else process.env.TZ = initialTimeZone;
});

function iso(dates: Date[]) {
	return dates.map(toISODate);
}

describe('makeDate', () => {
	test('builds a local midnight', () => {
		const date = makeDate(2026, 9, 9);
		expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 9]);
		expect([date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()]).toEqual([0, 0, 0, 0]);
	});

	test('keeps years below 100 instead of mapping them to 19xx', () => {
		expect(makeDate(12, 0, 1).getFullYear()).toBe(12);
		expect(makeDate(99, 11, 31).getFullYear()).toBe(99);
	});

	test('overflowing months and days roll over like the Date constructor', () => {
		expect(toISODate(makeDate(2026, 12, 1))).toBe('2027-01-01');
		expect(toISODate(makeDate(2026, 2, 0))).toBe('2026-02-28');
	});
});

describe('startOfDay, dayKey and sameDay', () => {
	test('startOfDay drops the time of day', () => {
		const date = startOfDay(new Date(2026, 9, 9, 23, 59, 59, 999));
		expect(date.getTime()).toBe(new Date(2026, 9, 9).getTime());
	});

	test('dayKey orders days and ignores the time of day', () => {
		expect(dayKey(new Date(2026, 9, 9, 18))).toBe(dayKey(new Date(2026, 9, 9)));
		expect(dayKey(new Date(2026, 9, 9))).toBeLessThan(dayKey(new Date(2026, 9, 10)));
		expect(dayKey(new Date(2026, 9, 31))).toBeLessThan(dayKey(new Date(2026, 10, 1)));
		expect(dayKey(new Date(2026, 11, 31))).toBeLessThan(dayKey(new Date(2027, 0, 1)));
	});

	test('v4 bug: sameDay ignores the time of day', () => {
		expect(sameDay(new Date(2026, 9, 9, 15, 30), new Date(2026, 9, 9))).toBe(true);
		expect(sameDay(new Date(2026, 9, 9, 23, 59), new Date(2026, 9, 10, 0, 1))).toBe(false);
	});

	test('sameDay is true only when both dates are missing', () => {
		expect(sameDay(undefined, undefined)).toBe(true);
		expect(sameDay(new Date(2026, 9, 9), undefined)).toBe(false);
		expect(sameDay(undefined, new Date(2026, 9, 9))).toBe(false);
	});
});

describe('addDays and addMonths', () => {
	test('addDays crosses months and years', () => {
		expect(toISODate(addDays(new Date(2026, 9, 31), 1))).toBe('2026-11-01');
		expect(toISODate(addDays(new Date(2027, 0, 1), -1))).toBe('2026-12-31');
		expect(toISODate(addDays(new Date(2026, 9, 9), -7))).toBe('2026-10-02');
	});

	test('addDays stays on local midnight across a daylight saving change', () => {
		inTimeZone('Europe/Rome');
		const after = addDays(new Date(2026, 9, 24), 2);
		expect(toISODate(after)).toBe('2026-10-26');
		expect(after.getHours()).toBe(0);
		const spring = addDays(new Date(2026, 2, 28), 2);
		expect(toISODate(spring)).toBe('2026-03-30');
		expect(spring.getHours()).toBe(0);
	});

	test('addMonths keeps the day when the target month has it', () => {
		expect(toISODate(addMonths(new Date(2026, 9, 9), 1))).toBe('2026-11-09');
		expect(toISODate(addMonths(new Date(2026, 9, 9), -1))).toBe('2026-09-09');
		expect(toISODate(addMonths(new Date(2026, 11, 15), 1))).toBe('2027-01-15');
		expect(toISODate(addMonths(new Date(2026, 0, 15), -1))).toBe('2025-12-15');
		expect(toISODate(addMonths(new Date(2026, 9, 9), 12))).toBe('2027-10-09');
		expect(toISODate(addMonths(new Date(2026, 9, 9), -12))).toBe('2025-10-09');
	});

	test('addMonths clamps the day to the end of a shorter month', () => {
		expect(toISODate(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
		expect(toISODate(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
		expect(toISODate(addMonths(new Date(2026, 2, 31), -1))).toBe('2026-02-28');
		expect(toISODate(addMonths(new Date(2026, 9, 31), 1))).toBe('2026-11-30');
		expect(toISODate(addMonths(new Date(2024, 1, 29), 12))).toBe('2025-02-28');
	});
});

describe('outOfBounds', () => {
	const min = new Date(2026, 9, 5);
	const max = new Date(2026, 9, 20);

	test('days before min or after max are out of bounds, the ends are inside', () => {
		expect(outOfBounds(new Date(2026, 9, 4), min, max)).toBe(true);
		expect(outOfBounds(new Date(2026, 9, 5), min, max)).toBe(false);
		expect(outOfBounds(new Date(2026, 9, 20), min, max)).toBe(false);
		expect(outOfBounds(new Date(2026, 9, 21), min, max)).toBe(true);
		expect(outOfBounds(new Date(1900, 0, 1), undefined, undefined)).toBe(false);
	});

	test('v4 bug: min and max with a time of day still include their own day', () => {
		const lateMin = new Date(2026, 9, 5, 18, 30);
		const earlyMax = new Date(2026, 9, 20, 0, 0, 1);
		expect(outOfBounds(new Date(2026, 9, 5), lateMin, earlyMax)).toBe(false);
		expect(outOfBounds(new Date(2026, 9, 20, 23), lateMin, earlyMax)).toBe(false);
	});

	test('isDateDisabled excludes more days', () => {
		const weekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
		expect(outOfBounds(new Date(2026, 9, 10), undefined, undefined, weekend)).toBe(true);
		expect(outOfBounds(new Date(2026, 9, 9), undefined, undefined, weekend)).toBe(false);
	});
});

describe('monthGrid', () => {
	test('always returns 42 consecutive days', () => {
		for (const [year, month] of [
			[2026, 1],
			[2026, 9],
			[2027, 0],
			[2015, 1]
		]) {
			const days = monthGrid(year, month, 1);
			expect(days).toHaveLength(42);
			for (let index = 1; index < days.length; index++)
				expect(toISODate(days[index])).toBe(toISODate(addDays(days[index - 1], 1)));
		}
	});

	test('v4 bug: in English (week from Sunday) October 2026 starts with Sunday 27 September', () => {
		const days = monthGrid(2026, 9, weekStartOf('en'));
		expect(toISODate(days[0])).toBe('2026-09-27');
		expect(days[0].getDay()).toBe(0);
		expect(toISODate(days[4])).toBe('2026-10-01');
		expect(toISODate(days[41])).toBe('2026-11-07');
	});

	test('with the week from Monday October 2026 starts with Monday 28 September', () => {
		const days = monthGrid(2026, 9, weekStartOf('it'));
		expect(toISODate(days[0])).toBe('2026-09-28');
		expect(days[0].getDay()).toBe(1);
		expect(toISODate(days[3])).toBe('2026-10-01');
	});

	test('a month that starts on the first day of the week starts on the first cell', () => {
		expect(toISODate(monthGrid(2026, 1, 0)[0])).toBe('2026-02-01');
		expect(toISODate(monthGrid(2026, 5, 1)[0])).toBe('2026-06-01');
	});

	test('a week from Saturday', () => {
		const days = monthGrid(2026, 9, 6);
		expect(days[0].getDay()).toBe(6);
		expect(toISODate(days[0])).toBe('2026-09-26');
	});

	test('v4 bug: February 2100 has 28 days (2100 is not a leap year)', () => {
		const days = iso(monthGrid(2100, 1, 1));
		expect(days).toContain('2100-02-28');
		expect(days).not.toContain('2100-02-29');
		expect(days[days.indexOf('2100-02-28') + 1]).toBe('2100-03-01');
		expect(iso(monthGrid(2000, 1, 1))).toContain('2000-02-29');
		expect(iso(monthGrid(2024, 1, 1))).toContain('2024-02-29');
	});
});

describe('weekStartOf', () => {
	test('reads the first day of the week from the region of the locale', () => {
		expect(weekStartOf('en')).toBe(0);
		expect(weekStartOf('en-US')).toBe(0);
		expect(weekStartOf('it')).toBe(1);
		expect(weekStartOf('it-IT')).toBe(1);
		expect(weekStartOf('en-GB')).toBe(1);
		expect(weekStartOf('de')).toBe(1);
		expect(weekStartOf('pt-BR')).toBe(0);
		expect(weekStartOf('he')).toBe(0);
		expect(weekStartOf('ar-EG')).toBe(6);
		expect(weekStartOf('fa')).toBe(6);
	});

	test('falls back to Monday for an unknown or invalid locale', () => {
		expect(weekStartOf('xx')).toBe(1);
		expect(weekStartOf('')).toBe(1);
		expect(weekStartOf('not a locale')).toBe(1);
	});
});

describe('names', () => {
	test('monthNames in the locale, capitalized', () => {
		expect(monthNames('en', 'long')[0]).toBe('January');
		expect(monthNames('en', 'short')[11]).toBe('Dec');
		expect(monthNames('it', 'long')).toHaveLength(12);
		expect(monthNames('it', 'long')[9]).toBe('Ottobre');
		expect(monthNames('it', 'short')[0]).toBe('Gen');
	});

	test('weekdayNames start from the given day and give the full name too', () => {
		const english = weekdayNames('en', 0, 'short');
		expect(english.map((day) => day.day)).toEqual([0, 1, 2, 3, 4, 5, 6]);
		expect(english[0]).toEqual({ day: 0, label: 'Sun', name: 'Sunday' });
		const italian = weekdayNames('it', 1, 'narrow');
		expect(italian.map((day) => day.day)).toEqual([1, 2, 3, 4, 5, 6, 0]);
		expect(italian[0]).toEqual({ day: 1, label: 'L', name: 'Lunedì' });
		expect(weekdayNames('en', 1, 'long')[6]).toEqual({ day: 0, label: 'Sunday', name: 'Sunday' });
	});

	test('monthTitle', () => {
		expect(monthTitle(2026, 9, 'en')).toBe('October 2026');
		expect(monthTitle(2026, 9, 'it')).toBe('Ottobre 2026');
	});
});

describe('formatOf', () => {
	test('reads the order and the separators of the locale', () => {
		expect(formatOf('it')).toBe('dd/MM/yyyy');
		expect(formatOf('en')).toBe('MM/dd/yyyy');
		expect(formatOf('en-GB')).toBe('dd/MM/yyyy');
		expect(formatOf('de')).toBe('dd.MM.yyyy');
		expect(formatOf('en-CA')).toBe('yyyy-MM-dd');
		expect(formatOf('nl')).toBe('dd-MM-yyyy');
	});

	test('drops trailing literals and bidirectional marks', () => {
		expect(formatOf('ko')).toBe('yyyy. MM. dd');
		expect(formatOf('ar-EG')).toBe('dd/MM/yyyy');
	});
});

describe('parseFormat and formatDate', () => {
	test('parseFormat splits a format in parts', () => {
		expect(parseFormat('dd/MM/yyyy')).toEqual([
			{ type: 'day', length: 2 },
			{ type: 'literal', value: '/' },
			{ type: 'month', length: 2 },
			{ type: 'literal', value: '/' },
			{ type: 'year', length: 4 }
		]);
		expect(parseFormat('yyyy. MM. dd')[1]).toEqual({ type: 'literal', value: '. ' });
	});

	test('formatDate pads every part', () => {
		expect(formatDate(new Date(2026, 0, 2), 'dd/MM/yyyy')).toBe('02/01/2026');
		expect(formatDate(new Date(2026, 0, 2), 'MM/dd/yyyy')).toBe('01/02/2026');
		expect(formatDate(new Date(2026, 0, 2), 'dd.MM.yyyy')).toBe('02.01.2026');
		expect(formatDate(makeDate(12, 0, 2), 'yyyy-MM-dd')).toBe('0012-01-02');
	});
});

describe('maskDate', () => {
	const it = 'dd/MM/yyyy';

	test('keeps only digits and inserts the separators', () => {
		expect(maskDate('12102026', it)).toBe('12/10/2026');
		expect(maskDate('12/10/2026', it)).toBe('12/10/2026');
		expect(maskDate('12-10-2026', it)).toBe('12/10/2026');
		expect(maskDate('ab12x10y2026', it)).toBe('12/10/2026');
		expect(maskDate('', it)).toBe('');
		expect(maskDate('abc', it)).toBe('');
	});

	test('a separator appears only when the next digit comes', () => {
		expect(maskDate('1', it)).toBe('1');
		expect(maskDate('12', it)).toBe('12');
		expect(maskDate('121', it)).toBe('12/1');
		expect(maskDate('1210', it)).toBe('12/10');
		expect(maskDate('12102', it)).toBe('12/10/2');
	});

	test('a typed separator stays', () => {
		expect(maskDate('12/', it)).toBe('12/');
		expect(maskDate('12/10/', it)).toBe('12/10/');
	});

	test('a separator after a single digit pads it', () => {
		expect(maskDate('5/', it)).toBe('05/');
		expect(maskDate('1/', it)).toBe('01/');
		expect(maskDate('1/3/', it)).toBe('01/03/');
		expect(maskDate('1/3/2026', it)).toBe('01/03/2026');
	});

	test('a lone 0 is not padded', () => {
		expect(maskDate('0/', it)).toBe('0');
		expect(maskDate('0', it)).toBe('0');
	});

	test('a first digit that cannot start a day (>3) or a month (>1) is zero-padded', () => {
		expect(maskDate('4', it)).toBe('04');
		expect(maskDate('3', it)).toBe('3');
		expect(maskDate('45', it)).toBe('04/05');
		expect(maskDate('122', it)).toBe('12/02');
		expect(maskDate('121', it)).toBe('12/1');
		expect(maskDate('2', 'MM/dd/yyyy')).toBe('02');
		expect(maskDate('1', 'MM/dd/yyyy')).toBe('1');
		expect(maskDate('124', 'MM/dd/yyyy')).toBe('12/04');
	});

	test('ignores digits after a full date', () => {
		expect(maskDate('121020261', it)).toBe('12/10/2026');
	});

	test('follows the order and the separators of the format', () => {
		expect(maskDate('20261', 'yyyy-MM-dd')).toBe('2026-1');
		expect(maskDate('2026109', 'yyyy-MM-dd')).toBe('2026-10-09');
		expect(maskDate('202', 'yyyy-MM-dd')).toBe('202');
		expect(maskDate('12102026', 'dd.MM.yyyy')).toBe('12.10.2026');
		expect(maskDate('20261009', 'yyyy. MM. dd')).toBe('2026. 10. 09');
	});
});

describe('maskInput', () => {
	const it = 'dd/MM/yyyy';

	test('editing a part in the middle keeps the parts after it', () => {
		expect(maskInput('1/09/2026', it, 1)).toEqual({ text: '1/09/2026', caret: 1 });
		expect(maskInput('15/09/2026', it, 2)).toEqual({ text: '15/09/2026', caret: 2 });
		expect(maskInput('10/1/2026', it, 4)).toEqual({ text: '10/1/2026', caret: 4 });
		expect(maskInput('10/0/2026', it, 4)).toEqual({ text: '10/0/2026', caret: 4 });
		expect(maskInput('10//2026', it, 3)).toEqual({ text: '10//2026', caret: 3 });
	});

	test('pads a part edited in the middle when its first digit cannot start it', () => {
		expect(maskInput('10/5/2026', it, 4)).toEqual({ text: '10/05/2026', caret: 5 });
	});

	test('a part that grows too long in the middle is cut, the rest stays', () => {
		expect(maskInput('110/09/2026', it, 1)).toEqual({ text: '11/09/2026', caret: 1 });
	});

	test('pads the parts that are not being edited, as when pasting', () => {
		expect(maskInput('9/10/2026', it)).toEqual({ text: '09/10/2026', caret: 10 });
		expect(maskInput(' 9/10/2026', it)).toEqual({ text: '09/10/2026', caret: 10 });
	});

	test('the caret follows the typed digit at the end', () => {
		expect(maskInput('9', it)).toEqual({ text: '09', caret: 2 });
		expect(maskInput('091', it)).toEqual({ text: '09/1', caret: 4 });
		expect(maskInput('5/', it)).toEqual({ text: '05/', caret: 3 });
	});

	test('separators longer than one character', () => {
		expect(maskInput('20260102', 'yyyy. MM. dd').text).toBe('2026. 01. 02');
		expect(maskInput('2026. 1. ', 'yyyy. MM. dd').text).toBe('2026. 01. ');
	});
});

describe('parseDate', () => {
	test('reads a complete date in the format', () => {
		expect(parseDate('12/10/2026', 'dd/MM/yyyy')?.getTime()).toBe(new Date(2026, 9, 12).getTime());
		expect(parseDate('10/12/2026', 'MM/dd/yyyy')?.getTime()).toBe(new Date(2026, 9, 12).getTime());
		expect(parseDate('2026-10-12', 'yyyy-MM-dd')?.getTime()).toBe(new Date(2026, 9, 12).getTime());
		expect(parseDate('12.10.2026', 'dd.MM.yyyy')?.getTime()).toBe(new Date(2026, 9, 12).getTime());
	});

	test('returns a local midnight', () => {
		const date = parseDate('12/10/2026', 'dd/MM/yyyy')!;
		expect(date.getHours() + date.getMinutes() + date.getSeconds()).toBe(0);
	});

	test('returns undefined for incomplete or malformed text', () => {
		expect(parseDate('12/10/26', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('12/10/20266', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('12.10.2026', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('1a/10/2026', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('', 'dd/MM/yyyy')).toBeUndefined();
	});

	test('returns undefined for days that do not exist', () => {
		expect(parseDate('31/02/2026', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('31/04/2026', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('00/10/2026', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('10/00/2026', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('10/13/2026', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('10/10/0000', 'dd/MM/yyyy')).toBeUndefined();
	});

	test('v4 bug: 29 February exists only in leap years (not in 2100)', () => {
		expect(parseDate('29/02/2100', 'dd/MM/yyyy')).toBeUndefined();
		expect(parseDate('29/02/2026', 'dd/MM/yyyy')).toBeUndefined();
		expect(toISODate(parseDate('29/02/2000', 'dd/MM/yyyy')!)).toBe('2000-02-29');
		expect(toISODate(parseDate('29/02/2024', 'dd/MM/yyyy')!)).toBe('2024-02-29');
	});

	test('keeps years below 100', () => {
		expect(parseDate('01/01/0012', 'dd/MM/yyyy')?.getFullYear()).toBe(12);
	});
});

describe('toISODate', () => {
	test('formats the local day as yyyy-MM-dd', () => {
		expect(toISODate(new Date(2026, 9, 9))).toBe('2026-10-09');
		expect(toISODate(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01');
		expect(toISODate(makeDate(12, 0, 2))).toBe('0012-01-02');
	});

	test('uses the local day, not the UTC one of toISOString', () => {
		inTimeZone('Europe/Rome');
		const midnight = new Date(2026, 9, 9);
		expect(midnight.toISOString().slice(0, 10)).toBe('2026-10-08');
		expect(toISODate(midnight)).toBe('2026-10-09');
		inTimeZone('America/Los_Angeles');
		const evening = new Date(2026, 9, 9, 20);
		expect(evening.toISOString().slice(0, 10)).toBe('2026-10-10');
		expect(toISODate(evening)).toBe('2026-10-09');
	});
});

describe('parseISODate', () => {
	test('reads yyyy-MM-dd as a local midnight', () => {
		inTimeZone('America/Los_Angeles');
		const date = parseISODate('2026-10-09')!;
		expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 9, 9, 0]);
		expect(new Date('2026-10-09').getDate()).toBe(8);
	});

	test('accepts full ISO timestamps and keeps their date part', () => {
		expect(toISODate(parseISODate('2026-10-09T23:30:00.000Z')!)).toBe('2026-10-09');
		expect(toISODate(parseISODate('2026-10-09T00:00:00+02:00')!)).toBe('2026-10-09');
		expect(parseISODate('2026-10-09T23:30:00.000Z')!.getHours()).toBe(0);
		expect(toISODate(parseISODate('2026-10-09 10:00:00')!)).toBe('2026-10-09');
	});

	test('trims spaces', () => {
		expect(toISODate(parseISODate('  2026-10-09 ')!)).toBe('2026-10-09');
	});

	test('rejects days that do not exist, including 2100-02-29', () => {
		expect(parseISODate('2100-02-29')).toBeUndefined();
		expect(parseISODate('2026-02-29')).toBeUndefined();
		expect(parseISODate('2026-02-30')).toBeUndefined();
		expect(parseISODate('2026-13-01')).toBeUndefined();
		expect(parseISODate('2026-00-10')).toBeUndefined();
		expect(toISODate(parseISODate('2024-02-29')!)).toBe('2024-02-29');
		expect(toISODate(parseISODate('2000-02-29')!)).toBe('2000-02-29');
	});

	test('rejects anything else', () => {
		expect(parseISODate(undefined)).toBeUndefined();
		expect(parseISODate(null)).toBeUndefined();
		expect(parseISODate('')).toBeUndefined();
		expect(parseISODate('09/10/2026')).toBeUndefined();
		expect(parseISODate('2026-1-9')).toBeUndefined();
		expect(parseISODate('today')).toBeUndefined();
		expect(parseISODate('2026-10-091')).toBeUndefined();
		expect(parseISODate('2026-10-09abc')).toBeUndefined();
	});

	test('round-trips with toISODate', () => {
		for (const text of ['2026-10-09', '2024-02-29', '1900-01-01', '2100-12-31', '0012-03-04'])
			expect(toISODate(parseISODate(text)!)).toBe(text);
	});
});
