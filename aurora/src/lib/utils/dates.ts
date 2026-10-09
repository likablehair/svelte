const SUNDAY_REGIONS = new Set(
	'AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(
		' '
	)
);
const SATURDAY_REGIONS = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));

export type DatePart =
	| { type: 'day' | 'month'; length: 2 }
	| { type: 'year'; length: 4 }
	| { type: 'literal'; value: string };

export function makeDate(year: number, month: number, day: number): Date {
	const date = new Date(2000, 0, 1);
	date.setFullYear(year, month, day);
	return date;
}

export function startOfDay(date: Date): Date {
	return makeDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
	return makeDate(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function addMonths(date: Date, months: number): Date {
	const first = makeDate(date.getFullYear(), date.getMonth() + months, 1);
	const last = makeDate(first.getFullYear(), first.getMonth() + 1, 0).getDate();
	return makeDate(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), last));
}

export function dayKey(date: Date): number {
	return date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
}

export function sameDay(a: Date | undefined, b: Date | undefined): boolean {
	if (!a || !b) return a === b;
	return dayKey(a) === dayKey(b);
}

export function outOfBounds(
	date: Date,
	min: Date | undefined,
	max: Date | undefined,
	isDateDisabled?: (date: Date) => boolean
): boolean {
	const key = dayKey(date);
	if (min && key < dayKey(min)) return true;
	if (max && key > dayKey(max)) return true;
	return !!isDateDisabled?.(date);
}

export function monthGrid(year: number, month: number, weekStart: number): Date[] {
	const offset = (makeDate(year, month, 1).getDay() - weekStart + 7) % 7;
	return Array.from({ length: 42 }, (_, index) => makeDate(year, month, 1 - offset + index));
}

export function weekStartOf(locale: string): number {
	try {
		const region = new Intl.Locale(locale).maximize().region;
		if (region && SUNDAY_REGIONS.has(region)) return 0;
		if (region && SATURDAY_REGIONS.has(region)) return 6;
	} catch {
		return 1;
	}
	return 1;
}

function capitalize(text: string, locale: string): string {
	return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

export function monthNames(locale: string, style: 'long' | 'short'): string[] {
	const format = new Intl.DateTimeFormat(locale, { month: style });
	return Array.from({ length: 12 }, (_, month) =>
		capitalize(format.format(makeDate(2026, month, 1)), locale)
	);
}

export function weekdayNames(
	locale: string,
	weekStart: number,
	style: 'narrow' | 'short' | 'long'
): { day: number; label: string; name: string }[] {
	const short = new Intl.DateTimeFormat(locale, { weekday: style });
	const long = new Intl.DateTimeFormat(locale, { weekday: 'long' });
	return Array.from({ length: 7 }, (_, index) => {
		const day = (weekStart + index) % 7;
		const date = makeDate(2026, 0, 4 + day);
		return {
			day,
			label: capitalize(short.format(date), locale),
			name: capitalize(long.format(date), locale)
		};
	});
}

export function monthTitle(year: number, month: number, locale: string): string {
	const format = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
	return capitalize(format.format(makeDate(year, month, 1)), locale);
}

export function formatOf(locale: string): string {
	const tokens = { day: 'dd', month: 'MM', year: 'yyyy' } as const;
	const parts = new Intl.DateTimeFormat(locale, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).formatToParts(makeDate(2026, 0, 2));
	let format = '';
	let pending = '';
	for (const part of parts) {
		if (part.type === 'day' || part.type === 'month' || part.type === 'year') {
			format += (format ? pending : '') + tokens[part.type];
			pending = '';
		} else if (part.type === 'literal') {
			pending += part.value.replace(/[‎‏؜]/g, '');
		}
	}
	return format || 'dd/MM/yyyy';
}

export function parseFormat(format: string): DatePart[] {
	const parts: DatePart[] = [];
	let index = 0;
	while (index < format.length) {
		if (format.startsWith('yyyy', index)) {
			parts.push({ type: 'year', length: 4 });
			index += 4;
		} else if (format.startsWith('MM', index)) {
			parts.push({ type: 'month', length: 2 });
			index += 2;
		} else if (format.startsWith('dd', index)) {
			parts.push({ type: 'day', length: 2 });
			index += 2;
		} else {
			const last = parts.at(-1);
			if (last?.type === 'literal') last.value += format[index];
			else parts.push({ type: 'literal', value: format[index] });
			index += 1;
		}
	}
	return parts;
}

export function formatDate(date: Date, format: string): string {
	return parseFormat(format)
		.map((part) => {
			if (part.type === 'literal') return part.value;
			const value =
				part.type === 'day'
					? date.getDate()
					: part.type === 'month'
						? date.getMonth() + 1
						: date.getFullYear();
			return String(value).padStart(part.length, '0');
		})
		.join('');
}

const isDigit = (char: string) => char >= '0' && char <= '9';

export function maskInput(
	raw: string,
	format: string,
	caret = raw.length
): { text: string; caret: number } {
	const parts = parseFormat(format);
	const fields = parts.filter((part) => part.type !== 'literal');
	const literals = parts.flatMap((part, index) =>
		part.type === 'literal' && index > 0 ? [part.value] : []
	);
	const groups: { digits: string; start: number; closed: boolean }[] = [];
	for (const token of raw.matchAll(/\d+|\D+/g)) {
		const value = token[0];
		if (isDigit(value[0])) {
			groups.push({ digits: value, start: token.index, closed: false });
			continue;
		}
		if (!groups.length) continue;
		groups[groups.length - 1].closed = true;
		const literal = literals[groups.length - 1] || value;
		let repeats = 1;
		while (value.startsWith(literal.repeat(repeats + 1))) repeats++;
		for (let extra = 1; extra < repeats; extra++)
			groups.push({ digits: '', start: token.index + literal.length * extra, closed: true });
	}
	let text = '';
	let position: number | undefined;
	let index = 0;
	let carry: { digits: string; start: number; closed: boolean } | undefined;
	for (let field = 0; field < fields.length; field++) {
		const part = fields[field] as Exclude<DatePart, { type: 'literal' }>;
		const group = carry ?? groups[index];
		if (!group) break;
		const last = !carry && index === groups.length - 1;
		const limit = part.type === 'day' ? 3 : 1;
		let digits = group.digits;
		let rest = '';
		const take = part.type !== 'year' && Number(digits[0]) > limit ? 1 : part.length;
		if (digits.length > take) {
			if ((carry || last) && !group.closed) rest = digits.slice(take);
			digits = digits.slice(0, take);
		}
		const end = group.start + digits.length;
		const hasCaret = rest
			? caret >= group.start && caret < end
			: caret >= group.start && caret <= group.start + group.digits.length;
		let pad = 0;
		if (digits.length < part.length && part.type !== 'year' && digits !== '' && digits !== '0') {
			const ended = !hasCaret && (group.closed || !last);
			if (ended || (digits.length === 1 && Number(digits) > limit)) pad = part.length - digits.length;
		}
		digits = '0'.repeat(pad) + digits;
		if (field > 0) text += literals[field - 1] ?? '';
		if (position === undefined && caret < group.start) position = text.length;
		const fieldStart = text.length;
		text += digits;
		if (position === undefined && hasCaret)
			position = fieldStart + pad + Math.min(caret - group.start, digits.length - pad);
		if (rest) {
			carry = { digits: rest, start: end, closed: group.closed };
			continue;
		}
		carry = undefined;
		index++;
		const complete = digits.length === part.length;
		if (index >= groups.length) {
			if (complete && group.closed && field < fields.length - 1) text += literals[field] ?? '';
			break;
		}
	}
	return { text, caret: position ?? text.length };
}

export function maskDate(raw: string, format: string): string {
	return maskInput(raw, format).text;
}

export function parseDate(text: string, format: string): Date | undefined {
	const parts = parseFormat(format);
	const length = parts.reduce(
		(total, part) => total + (part.type === 'literal' ? part.value.length : part.length),
		0
	);
	if (text.length !== length) return undefined;
	let index = 0;
	let day = 0;
	let month = 0;
	let year = 0;
	for (const part of parts) {
		if (part.type === 'literal') {
			if (text.slice(index, index + part.value.length) !== part.value) return undefined;
			index += part.value.length;
			continue;
		}
		const chunk = text.slice(index, index + part.length);
		if (!/^\d+$/.test(chunk)) return undefined;
		const value = Number(chunk);
		if (part.type === 'day') day = value;
		else if (part.type === 'month') month = value;
		else year = value;
		index += part.length;
	}
	return validDate(year, month, day);
}

function validDate(year: number, month: number, day: number): Date | undefined {
	if (year < 1 || month < 1 || month > 12 || day < 1) return undefined;
	const date = makeDate(year, month - 1, day);
	return date.getDate() === day && date.getMonth() === month - 1 ? date : undefined;
}

/**
 * Formats a date as `yyyy-MM-dd` in local time, the format of `<input type="date">` and of the
 * hidden inputs of the date fields. Use it instead of `toISOString()`, which converts to UTC and
 * returns the previous day for a local midnight east of Greenwich.
 */
export function toISODate(date: Date): string {
	return formatDate(date, 'yyyy-MM-dd');
}

/**
 * Reads a `yyyy-MM-dd` string (a full ISO timestamp is cut to its date part) as a local midnight
 * `Date`, the value the date components work with. Returns `undefined` for anything else or for a
 * day that does not exist. Use it instead of `new Date('2026-10-09')`, which reads the string as
 * UTC midnight.
 */
export function parseISODate(text: string | null | undefined): Date | undefined {
	const match = /^(\d{4})-(\d{2})-(\d{2})(?=$|[Tt\s])/.exec(text?.trim() ?? '');
	if (!match) return undefined;
	return validDate(Number(match[1]), Number(match[2]), Number(match[3]));
}
