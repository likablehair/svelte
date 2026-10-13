import {
	dateMaskParts,
	formatDate,
	makeDate,
	maskParts,
	parseDate,
	parseISODate,
	toISODate,
	type MaskPart
} from './dates.js';

/** A time of day: `hours` from 0 to 23 and `minutes` from 0 to 59. */
export interface TimeOfDay {
	hours: number;
	minutes: number;
}

const CLOCK_24: MaskPart[] = [{ length: 2, limit: 2 }, { literal: ':' }, { length: 2, limit: 5 }];
const CLOCK_12: MaskPart[] = [{ length: 2, limit: 1 }, { literal: ':' }, { length: 2, limit: 5 }];
const FULL_24 = /^\s*(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*$/;
const FULL_12 = /^\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])\.?\s*m?\.?\s*$/i;
const DATED_12 = /^(.*\d)\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])\.?\s*m?\.?\s*$/i;
const ISO_DATE_TIME =
	/^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})?$/i;

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Reads a time of day written as `HH:mm` (24-hour), the value of the time components and of
 * `<input type="time">`. Seconds (`HH:mm:ss`, as a Postgres `time` column returns them) are
 * accepted and dropped. Returns `undefined` for anything else or for a time that does not exist.
 */
export function parseTime(text: string | null | undefined): TimeOfDay | undefined {
	const match = FULL_24.exec(text ?? '');
	if (!match) return undefined;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	return hours < 24 && minutes < 60 ? { hours, minutes } : undefined;
}

/**
 * Writes a time of day as `HH:mm` (24-hour), the value of the time components. Takes
 * `{ hours, minutes }` or a `Date`, whose local time it uses.
 */
export function formatTime(time: TimeOfDay | Date): string {
	return time instanceof Date
		? `${pad(time.getHours())}:${pad(time.getMinutes())}`
		: `${pad(time.hours)}:${pad(time.minutes)}`;
}

export function timeKey(text: string | null | undefined): number | undefined {
	const time = parseTime(text);
	return time ? time.hours * 60 + time.minutes : undefined;
}

export function keyTime(key: number): string {
	return formatTime({ hours: Math.floor(key / 60), minutes: key % 60 });
}

export function inTimeRange(key: number, min: number | undefined, max: number | undefined): boolean {
	if (min !== undefined && max !== undefined && min > max) return key >= min || key <= max;
	return (min === undefined || key >= min) && (max === undefined || key <= max);
}

export function hour12Of(locale: string): boolean {
	try {
		const options = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
		return options.hourCycle ? options.hourCycle === 'h11' || options.hourCycle === 'h12' : !!options.hour12;
	} catch {
		return false;
	}
}

export function periodNames(locale: string): [string, string] {
	try {
		const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', hourCycle: 'h12' });
		const name = (hours: number) =>
			format
				.formatToParts(new Date(2026, 0, 1, hours))
				.find((part) => part.type === 'dayPeriod')
				?.value.trim();
		const am = name(1);
		const pm = name(13);
		if (am && pm && am !== pm) return [am, pm];
	} catch {
		return ['AM', 'PM'];
	}
	return ['AM', 'PM'];
}

export function formatTimeText(
	value: string | null | undefined,
	hour12: boolean,
	periods: [string, string]
): string {
	const time = parseTime(value);
	if (!time) return '';
	if (!hour12) return formatTime(time);
	return `${pad(time.hours % 12 || 12)}:${pad(time.minutes)} ${periods[time.hours < 12 ? 0 : 1]}`;
}

export function parseTimeText(
	text: string,
	hour12: boolean,
	periods: [string, string]
): string | undefined {
	const match = (hour12 ? /^(\d{2}):(\d{2}) (.+)$/ : /^(\d{2}):(\d{2})$/).exec(text);
	if (!match) return undefined;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (minutes > 59) return undefined;
	if (!hour12) return hours < 24 ? formatTime({ hours, minutes }) : undefined;
	const period = periods.indexOf(match[3]);
	if (hours < 1 || hours > 12 || period < 0) return undefined;
	return formatTime({ hours: (hours % 12) + period * 12, minutes });
}

const normalize = (text: string) => text.toLowerCase().replace(/[\s.]/g, '');

function periodOf(letters: string, periods: [string, string]): 0 | 1 | 'partial' | undefined {
	const typed = normalize(letters);
	if (!typed) return undefined;
	const names = periods.map(normalize);
	const exact = names.indexOf(typed);
	if (exact >= 0) return exact as 0 | 1;
	const latin = [...typed].reverse().find((char) => char === 'a' || char === 'p');
	if (latin) return latin === 'a' ? 0 : 1;
	const rest = names.reduce((text, name) => (text.startsWith(name) ? text.slice(name.length) : text), typed);
	const matches = names.flatMap((name, index) => (name.startsWith(rest) ? [index as 0 | 1] : []));
	if (matches.length === 1) return matches[0];
	return matches.length ? 'partial' : undefined;
}

function fromTwelve(hoursText: string, minutesText: string, period: string): string | undefined {
	const hours = Number(hoursText);
	const minutes = Number(minutesText);
	if (hours < 1 || hours > 12 || minutes > 59) return undefined;
	return formatTime({ hours: (hours % 12) + (period.toLowerCase() === 'p' ? 12 : 0), minutes });
}

type MaskOptions = { caret?: number; deleting?: boolean; pasted?: boolean };

function maskClock(
	raw: string,
	prefix: MaskPart[],
	hour12: boolean,
	periods: [string, string],
	options: MaskOptions
): { text: string; caret: number } {
	const { caret = raw.length, deleting = false, pasted = false } = options;
	const lead: MaskPart[] = prefix.length ? [...prefix, { literal: ' ' }] : [];
	const start = lead.reduce((total, part) => total + ('literal' in part ? part.literal.length : part.length), 0);
	const dated = new RegExp(
		`^${lead.map((part) => ('literal' in part ? part.literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : `\\d{${part.length}}`)).join('')}`
	);
	if (!hour12 && pasted) {
		const twelve = prefix.length ? DATED_12.exec(raw) : FULL_12.exec(raw);
		const parts = twelve?.slice(prefix.length ? 2 : 1, prefix.length ? 5 : 4);
		const value = parts && fromTwelve(parts[0], parts[1], parts[2]);
		if (twelve && value) {
			if (!prefix.length) return { text: value, caret: -1 };
			const date = twelve[1].replace(/\p{L}/gu, '');
			return { text: maskParts(`${date} ${value}`, [...lead, ...CLOCK_24]).text, caret: -1 };
		}
	}
	if (!hour12) {
		const before = raw.slice(0, caret).replace(/\p{L}/gu, '').length;
		return maskParts(raw.replace(/\p{L}/gu, ''), [...lead, ...CLOCK_24], before);
	}
	const split = raw.search(/\p{L}/u);
	const numeric = (split < 0 ? raw : raw.slice(0, split)).trimEnd();
	const letters = split < 0 ? '' : raw.slice(split);
	const inLetters = split >= 0 && caret > split;
	const masked = maskParts(numeric, [...lead, ...CLOCK_12], Math.min(caret, numeric.length));
	const whole = dated.test(masked.text);
	const date = whole ? masked.text.slice(0, start) : masked.text;
	const clock = whole ? masked.text.slice(start) : '';
	const period = periodOf(letters, periods);
	if (period === undefined) {
		const full = /^(\d{2}):(\d{2})$/.exec(clock);
		const hours = Number(full?.[1]);
		if (full && hours < 24 && Number(full[2]) < 60 && (pasted || hours === 0 || hours > 12))
			return { text: date + formatTimeText(clock, true, periods), caret: -1 };
	}
	const end = { text: masked.text, caret: inLetters ? masked.text.length : masked.caret };
	if (period === undefined || !clock) return end;
	if (period === 'partial') return { text: `${masked.text} ${letters.trim()}`, caret: -1 };
	if (deleting && normalize(letters) !== normalize(periods[period])) return end;
	if (!inLetters) return { text: `${masked.text} ${periods[period]}`, caret: masked.caret };
	const [hours, minutes = ''] = clock.split(':');
	const text = `${date}${hours.padStart(2, '0')}:${minutes ? minutes.padStart(2, '0') : '00'} ${periods[period]}`;
	return { text, caret: -1 };
}

export function maskTime(
	raw: string,
	hour12: boolean,
	periods: [string, string],
	options: MaskOptions = {}
): { text: string; caret: number } {
	return maskClock(raw, [], hour12, periods, options);
}

export function maskDateTime(
	raw: string,
	format: string,
	hour12: boolean,
	periods: [string, string],
	options: MaskOptions = {}
): { text: string; caret: number } {
	return maskClock(raw, dateMaskParts(format), hour12, periods, options);
}

export function formatDateTimeText(
	date: Date,
	format: string,
	hour12: boolean,
	periods: [string, string]
): string {
	return `${formatDate(date, format)} ${formatTimeText(formatTime(date), hour12, periods)}`;
}

export function parseDateTimeText(
	text: string,
	format: string,
	hour12: boolean,
	periods: [string, string]
): Date | undefined {
	const length = formatDate(new Date(2000, 0, 1), format).length;
	if (text[length] !== ' ') return undefined;
	const date = parseDate(text.slice(0, length), format);
	const time = parseTime(parseTimeText(text.slice(length + 1), hour12, periods));
	return date && time ? atTime(date, time) : undefined;
}

export function atTime(day: Date, time: TimeOfDay): Date | undefined {
	const date = makeDate(day.getFullYear(), day.getMonth(), day.getDate());
	date.setHours(time.hours, time.minutes, 0, 0);
	return date.getHours() === time.hours && date.getMinutes() === time.minutes ? date : undefined;
}

/**
 * Writes a date and time as `yyyy-MM-ddTHH:mm` in local time: the value of the hidden input of
 * `DateTimePickerTextField` and of `<input type="datetime-local">`. Seconds are dropped. Use it
 * instead of `toISOString()`, which converts to UTC.
 */
export function toISODateTime(date: Date): string {
	return `${toISODate(date)}T${formatTime(date)}`;
}

/**
 * Reads a local date and time written as `yyyy-MM-ddTHH:mm` (seconds are read too, and a space
 * can replace the `T`) as a `Date`. A string with a time zone (`Z`, `+02:00`) is read as that
 * instant. Returns `undefined` for anything else, and for a local time that does not exist (the
 * hour skipped when daylight saving time starts). Use it instead of `new Date(text)`, which reads
 * a date without a time as UTC.
 */
export function parseISODateTime(text: string | null | undefined): Date | undefined {
	const trimmed = text?.trim() ?? '';
	const match = ISO_DATE_TIME.exec(trimmed);
	if (!match) return undefined;
	const day = parseISODate(trimmed.slice(0, 10));
	const hours = Number(match[4]);
	const minutes = Number(match[5]);
	const seconds = Number(match[6] ?? 0);
	if (!day || hours > 23 || minutes > 59 || seconds > 59) return undefined;
	if (match[8]) {
		const instant = new Date(trimmed.replace(' ', 'T'));
		return Number.isNaN(instant.getTime()) ? undefined : instant;
	}
	const date = atTime(day, { hours, minutes });
	date?.setSeconds(seconds, Number((match[7] ?? '0').slice(0, 3).padEnd(3, '0')));
	return date;
}
