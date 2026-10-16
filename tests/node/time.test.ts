import { describe, expect, test } from 'vitest';
import { maskInput } from '../../src/lib/utils/dates.js';
import {
	formatDateTimeText,
	formatTime,
	formatTimeText,
	hour12Of,
	inTimeRange,
	keyTime,
	maskDateTime,
	maskTime,
	parseDateTimeText,
	parseISODateTime,
	parseTime,
	parseTimeText,
	periodNames,
	timeKey,
	toISODateTime
} from '../../src/lib/utils/time.js';

const en: [string, string] = ['AM', 'PM'];

function mask24(raw: string, options?: Parameters<typeof maskTime>[3]) {
	return maskTime(raw, false, en, options).text;
}

function mask12(raw: string, options?: Parameters<typeof maskTime>[3]) {
	return maskTime(raw, true, en, options).text;
}

describe('parseTime', () => {
	test('reads HH:mm and H:mm', () => {
		expect(parseTime('14:30')).toEqual({ hours: 14, minutes: 30 });
		expect(parseTime('09:05')).toEqual({ hours: 9, minutes: 5 });
		expect(parseTime('9:05')).toEqual({ hours: 9, minutes: 5 });
		expect(parseTime('00:00')).toEqual({ hours: 0, minutes: 0 });
		expect(parseTime('23:59')).toEqual({ hours: 23, minutes: 59 });
	});

	test('accepts seconds and fractions and drops them, and trims spaces', () => {
		expect(parseTime('14:30:00')).toEqual({ hours: 14, minutes: 30 });
		expect(parseTime('14:30:59.123')).toEqual({ hours: 14, minutes: 30 });
		expect(parseTime(' 14:30 ')).toEqual({ hours: 14, minutes: 30 });
	});

	test('returns undefined for times that do not exist and for anything else', () => {
		for (const text of ['24:00', '12:60', '1430', '14:3', '14:30 PM', 'T14:30', '', 'abc', '14:30:'])
			expect(parseTime(text), text).toBeUndefined();
		expect(parseTime(undefined)).toBeUndefined();
		expect(parseTime(null)).toBeUndefined();
	});
});

describe('formatTime', () => {
	test('writes { hours, minutes } as HH:mm', () => {
		expect(formatTime({ hours: 9, minutes: 5 })).toBe('09:05');
		expect(formatTime({ hours: 23, minutes: 59 })).toBe('23:59');
	});

	test('writes the local time of a Date', () => {
		expect(formatTime(new Date(2026, 8, 24, 7, 3, 45))).toBe('07:03');
		expect(formatTime(new Date(2026, 8, 24))).toBe('00:00');
	});

	test('round-trips with parseTime', () => {
		expect(formatTime(parseTime('9:30:15')!)).toBe('09:30');
	});
});

describe('timeKey, keyTime and inTimeRange', () => {
	test('timeKey counts the minutes since midnight', () => {
		expect(timeKey('00:00')).toBe(0);
		expect(timeKey('01:30')).toBe(90);
		expect(timeKey('23:59:59')).toBe(1439);
		expect(timeKey('nope')).toBeUndefined();
		expect(keyTime(90)).toBe('01:30');
		expect(keyTime(1439)).toBe('23:59');
	});

	test('a range is inclusive and each end is optional', () => {
		expect(inTimeRange(480, 480, 1080)).toBe(true);
		expect(inTimeRange(1080, 480, 1080)).toBe(true);
		expect(inTimeRange(479, 480, 1080)).toBe(false);
		expect(inTimeRange(1081, 480, 1080)).toBe(false);
		expect(inTimeRange(10, undefined, 1080)).toBe(true);
		expect(inTimeRange(1439, 480, undefined)).toBe(true);
		expect(inTimeRange(0, undefined, undefined)).toBe(true);
	});

	test('min later than max crosses midnight', () => {
		const min = timeKey('22:00');
		const max = timeKey('06:00');
		expect(inTimeRange(timeKey('23:30')!, min, max)).toBe(true);
		expect(inTimeRange(timeKey('00:00')!, min, max)).toBe(true);
		expect(inTimeRange(timeKey('06:00')!, min, max)).toBe(true);
		expect(inTimeRange(timeKey('12:00')!, min, max)).toBe(false);
		expect(inTimeRange(timeKey('21:59')!, min, max)).toBe(false);
	});
});

describe('hour12Of and periodNames', () => {
	test('the hour cycle comes from the locale', () => {
		expect(hour12Of('en')).toBe(true);
		expect(hour12Of('en-US')).toBe(true);
		expect(hour12Of('it')).toBe(false);
		expect(hour12Of('en-GB')).toBe(false);
		expect(hour12Of('de')).toBe(false);
	});

	test('an invalid locale falls back to the 24-hour clock and AM/PM', () => {
		expect(hour12Of('not a locale')).toBe(false);
		expect(periodNames('not a locale')).toEqual(['AM', 'PM']);
	});

	test('AM and PM names come from the locale', () => {
		expect(periodNames('en')).toEqual(['AM', 'PM']);
		const [am, pm] = periodNames('es-US');
		expect(am).not.toBe(pm);
		expect(am.toLowerCase().startsWith('a')).toBe(true);
	});
});

describe('formatTimeText and parseTimeText', () => {
	test('24-hour text is the value', () => {
		expect(formatTimeText('14:30', false, en)).toBe('14:30');
		expect(formatTimeText('9:05:00', false, en)).toBe('09:05');
		expect(parseTimeText('14:30', false, en)).toBe('14:30');
		expect(parseTimeText('24:00', false, en)).toBeUndefined();
		expect(parseTimeText('14:3', false, en)).toBeUndefined();
	});

	test('12-hour text has the hour from 1 to 12 and the period', () => {
		expect(formatTimeText('00:15', true, en)).toBe('12:15 AM');
		expect(formatTimeText('09:30', true, en)).toBe('09:30 AM');
		expect(formatTimeText('12:00', true, en)).toBe('12:00 PM');
		expect(formatTimeText('23:45', true, en)).toBe('11:45 PM');
		expect(parseTimeText('12:15 AM', true, en)).toBe('00:15');
		expect(parseTimeText('12:00 PM', true, en)).toBe('12:00');
		expect(parseTimeText('11:45 PM', true, en)).toBe('23:45');
	});

	test('12-hour text without a valid hour or period is not a time', () => {
		for (const text of ['00:15 AM', '13:00 PM', '09:30', '09:30 XM', '09:60 AM'])
			expect(parseTimeText(text, true, en), text).toBeUndefined();
	});

	test('empty or invalid values give an empty text', () => {
		expect(formatTimeText(undefined, true, en)).toBe('');
		expect(formatTimeText('nope', false, en)).toBe('');
	});
});

describe('maskTime, 24-hour', () => {
	test('keeps digits only and adds the colon when the next digit comes', () => {
		expect(mask24('1')).toBe('1');
		expect(mask24('14')).toBe('14');
		expect(mask24('143')).toBe('14:3');
		expect(mask24('1430')).toBe('14:30');
		expect(mask24('14301')).toBe('14:30');
		expect(mask24('ab1x4:3y0')).toBe('14:30');
	});

	test('a first digit that cannot start an hour (>2) or minutes (>5) is padded', () => {
		expect(mask24('9')).toBe('09');
		expect(mask24('93')).toBe('09:3');
		expect(mask24('096')).toBe('09:06');
		expect(mask24('2')).toBe('2');
		expect(mask24('23')).toBe('23');
	});

	test('a typed colon after one digit pads it', () => {
		expect(mask24('9:')).toBe('09:');
		expect(mask24('9:5')).toBe('09:5');
		expect(mask24('0:')).toBe('0');
	});

	test('the caret follows the typed digit', () => {
		expect(maskTime('9', false, en)).toEqual({ text: '09', caret: 2 });
		expect(maskTime('093', false, en)).toEqual({ text: '09:3', caret: 4 });
		expect(maskTime('1:30', false, en, { caret: 1 })).toEqual({ text: '1:30', caret: 1 });
	});

	test('seconds are dropped', () => {
		expect(mask24('14:30:00')).toBe('14:30');
	});

	test('impossible hours stay, so the field can show the error', () => {
		expect(mask24('25')).toBe('25');
		expect(mask24('2559')).toBe('25:59');
		expect(mask24('2599')).toBe('25:09');
	});

	test('a pasted 12-hour time becomes 24-hour; typed letters are ignored', () => {
		expect(mask24('2:30 PM', { pasted: true })).toBe('14:30');
		expect(mask24('12:15am', { pasted: true })).toBe('00:15');
		expect(mask24('11:00 p.m.', { pasted: true })).toBe('23:00');
		expect(mask24('12:30a')).toBe('12:30');
	});
});

describe('maskTime, 12-hour', () => {
	test('the hour accepts 1 and waits, a higher first digit is padded', () => {
		expect(mask12('1')).toBe('1');
		expect(mask12('2')).toBe('02');
		expect(mask12('9')).toBe('09');
		expect(mask12('930')).toBe('09:30');
	});

	test('A and P set the period and complete the time', () => {
		expect(mask12('0930p')).toBe('09:30 PM');
		expect(mask12('09:30a')).toBe('09:30 AM');
		expect(mask12('9p')).toBe('09:00 PM');
		expect(mask12('09:3p')).toBe('09:03 PM');
		expect(mask12('09:30 pm')).toBe('09:30 PM');
		expect(mask12('09:30 PMm')).toBe('09:30 PM');
	});

	test('the last A or P typed wins', () => {
		expect(mask12('09:30 PMa')).toBe('09:30 AM');
		expect(mask12('09:30 AMp')).toBe('09:30 PM');
	});

	test('a whole 24-hour time with hour 0 or 13–23 turns into 12-hour', () => {
		expect(mask12('1430')).toBe('02:30 PM');
		expect(mask12('14:30')).toBe('02:30 PM');
		expect(mask12('00:15')).toBe('12:15 AM');
		expect(mask12('12:30')).toBe('12:30');
		expect(mask12('09:30')).toBe('09:30');
	});

	test('a pasted 24-hour time always turns into 12-hour', () => {
		expect(mask12('09:30', { pasted: true })).toBe('09:30 AM');
		expect(mask12('12:30:00', { pasted: true })).toBe('12:30 PM');
		expect(mask12(' 2:05 pm ', { pasted: true })).toBe('02:05 PM');
	});

	test('deleting a letter of the period removes the period', () => {
		expect(maskTime('09:30 P', true, en, { deleting: true })).toEqual({ text: '09:30', caret: 5 });
		expect(maskTime('09:30 PM', true, en, { deleting: true }).text).toBe('09:30 PM');
	});

	test('editing the digits keeps the period and the caret', () => {
		expect(maskTime('1:30 PM', true, en, { caret: 1 })).toEqual({ text: '1:30 PM', caret: 1 });
		expect(maskTime('11:30 PM', true, en, { caret: 2 })).toEqual({ text: '11:30 PM', caret: 2 });
	});

	test('letters without digits, or that are not a period, are dropped', () => {
		expect(mask12('p')).toBe('');
		expect(mask12('09:30 x')).toBe('09:30');
	});

	test('localized period names are written in full', () => {
		const spanish: [string, string] = ['a. m.', 'p. m.'];
		expect(maskTime('0930p', true, spanish).text).toBe('09:30 p. m.');
		expect(parseTimeText('09:30 p. m.', true, spanish)).toBe('21:30');
		const chinese: [string, string] = ['上午', '下午'];
		expect(maskTime('0930下', true, chinese).text).toBe('09:30 下午');
		const japanese: [string, string] = ['午前', '午後'];
		expect(maskTime('09:30 午', true, japanese).text).toBe('09:30 午');
		expect(maskTime('09:30 午後', true, japanese).text).toBe('09:30 午後');
	});
});

describe('maskInput still masks dates after the refactor', () => {
	test('day, month and year keep their limits', () => {
		expect(maskInput('4', 'dd/MM/yyyy').text).toBe('04');
		expect(maskInput('122', 'dd/MM/yyyy').text).toBe('12/02');
		expect(maskInput('20261', 'yyyy-MM-dd').text).toBe('2026-1');
	});
});

describe('maskDateTime', () => {
	const it24 = (raw: string, options?: Parameters<typeof maskDateTime>[4]) =>
		maskDateTime(raw, 'dd/MM/yyyy', false, en, options).text;
	const en12 = (raw: string, options?: Parameters<typeof maskDateTime>[4]) =>
		maskDateTime(raw, 'MM/dd/yyyy', true, en, options).text;

	test('digits fill the date, then a space and the time, with every separator added', () => {
		expect(it24('24')).toBe('24');
		expect(it24('240')).toBe('24/0');
		expect(it24('24092026')).toBe('24/09/2026');
		expect(it24('240920261')).toBe('24/09/2026 1');
		expect(it24('24092026103')).toBe('24/09/2026 10:3');
		expect(it24('2409202610305')).toBe('24/09/2026 10:30');
	});

	test('typed separators close a part and pad it; any separator becomes the expected one', () => {
		expect(it24('4/9/2026 9:5')).toBe('04/09/2026 09:5');
		expect(it24('24.09.2026-10.30')).toBe('24/09/2026 10:30');
		expect(it24('24/09/2026 ')).toBe('24/09/2026 ');
		expect(it24('24/09/2026 9')).toBe('24/09/2026 09');
	});

	test('the caret follows the typed digit across the separators', () => {
		expect(maskDateTime('24/09/20261', 'dd/MM/yyyy', false, en, { caret: 11 })).toEqual({
			text: '24/09/2026 1',
			caret: 12
		});
		expect(maskDateTime('24/09/2026 10:30', 'dd/MM/yyyy', false, en, { caret: 2 })).toEqual({
			text: '24/09/2026 10:30',
			caret: 2
		});
	});

	test('letters are dropped on a 24-hour clock; a pasted 12-hour time becomes 24-hour', () => {
		expect(it24('24/09/2026 10:30 pm')).toBe('24/09/2026 10:30');
		expect(it24('24/09/2026 2:30 PM', { pasted: true })).toBe('24/09/2026 14:30');
		expect(it24('24/09/2026 12:05 am', { pasted: true })).toBe('24/09/2026 00:05');
	});

	test('on a 12-hour clock A and P complete the time, and a whole 24-hour time turns into 12-hour', () => {
		expect(en12('092420260930')).toBe('09/24/2026 09:30');
		expect(en12('092420260930p')).toBe('09/24/2026 09:30 PM');
		expect(en12('09242026930a')).toBe('09/24/2026 09:30 AM');
		expect(en12('09/24/2026 9p')).toBe('09/24/2026 09:00 PM');
		expect(en12('09/24/2026 14:30')).toBe('09/24/2026 02:30 PM');
		expect(en12('09/24/2026 00:15')).toBe('09/24/2026 12:15 AM');
		expect(en12('09/24/2026 10:30', { pasted: true })).toBe('09/24/2026 10:30 AM');
	});

	test('a period typed before the date is whole is dropped', () => {
		expect(en12('09/24/20 p')).toBe('09/24/20');
		expect(en12('1/2/26 10:00p')).toBe('01/02/26 10:00');
	});

	test('formats with spaces and other orders work', () => {
		expect(maskDateTime('202609241030', 'yyyy-MM-dd', false, en).text).toBe('2026-09-24 10:30');
		expect(maskDateTime('240920261030', 'dd. MM. yyyy', false, en).text).toBe('24. 09. 2026 10:30');
	});
});

describe('formatDateTimeText and parseDateTimeText', () => {
	test('the text is the date in the format, a space and the time on the clock', () => {
		const date = new Date(2026, 8, 24, 14, 5);
		expect(formatDateTimeText(date, 'dd/MM/yyyy', false, en)).toBe('24/09/2026 14:05');
		expect(formatDateTimeText(date, 'MM/dd/yyyy', true, en)).toBe('09/24/2026 02:05 PM');
		expect(formatDateTimeText(new Date(2026, 8, 24, 0, 0), 'MM/dd/yyyy', true, en)).toBe('09/24/2026 12:00 AM');
	});

	test('parses back to a local Date with seconds at 0', () => {
		expect(parseDateTimeText('24/09/2026 14:05', 'dd/MM/yyyy', false, en)).toEqual(new Date(2026, 8, 24, 14, 5));
		expect(parseDateTimeText('09/24/2026 02:05 PM', 'MM/dd/yyyy', true, en)).toEqual(new Date(2026, 8, 24, 14, 5));
		expect(parseDateTimeText('09/24/2026 12:00 AM', 'MM/dd/yyyy', true, en)).toEqual(new Date(2026, 8, 24));
	});

	test('anything unfinished or that does not exist is not a date and time', () => {
		for (const text of ['', '24/09/2026', '24/09/2026 ', '24/09/2026 14:3', '31/02/2026 10:00', '24/09/2026 24:00', '24/09/2026 10:60', '24/09/202614:05'])
			expect(parseDateTimeText(text, 'dd/MM/yyyy', false, en)).toBeUndefined();
		expect(parseDateTimeText('09/24/2026 02:05', 'MM/dd/yyyy', true, en)).toBeUndefined();
		expect(parseDateTimeText('09/24/2026 13:05 PM', 'MM/dd/yyyy', true, en)).toBeUndefined();
	});
});

describe('toISODateTime and parseISODateTime', () => {
	test('write and read the local yyyy-MM-ddTHH:mm', () => {
		expect(toISODateTime(new Date(2026, 8, 24, 9, 5, 30))).toBe('2026-09-24T09:05');
		expect(toISODateTime(new Date(2026, 0, 1))).toBe('2026-01-01T00:00');
		expect(parseISODateTime('2026-09-24T09:05')).toEqual(new Date(2026, 8, 24, 9, 5));
		expect(parseISODateTime(' 2026-09-24 09:05 ')).toEqual(new Date(2026, 8, 24, 9, 5));
		expect(parseISODateTime('2026-09-24T09:05:30.25')).toEqual(new Date(2026, 8, 24, 9, 5, 30, 250));
		expect(parseISODateTime(toISODateTime(new Date(2026, 1, 28, 23, 59)))).toEqual(new Date(2026, 1, 28, 23, 59));
	});

	test('a time zone is read as that instant', () => {
		expect(parseISODateTime('2026-09-24T08:00Z')).toEqual(new Date(Date.UTC(2026, 8, 24, 8)));
		expect(parseISODateTime('2026-09-24T10:00:00+02:00')).toEqual(new Date(Date.UTC(2026, 8, 24, 8)));
	});

	test('returns undefined for anything else', () => {
		for (const text of [undefined, null, '', '2026-09-24', '2026-02-30T10:00', '2026-09-24T24:00', '2026-09-24T10:60', '24/09/2026 10:00', 'nope'])
			expect(parseISODateTime(text)).toBeUndefined();
	});
});
