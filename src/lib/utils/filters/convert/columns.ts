import { parseISODate, toISODate } from '../../dates.js';
import FilterBuilder, { type WhereModifier } from '../builder.js';
import type {
	BoolFilterField,
	DateFilterField,
	FilterField,
	FilterItem,
	FilterLogic,
	FilterPeriod,
	NumberFilterField,
	SelectFilterField,
	StringFilterField
} from '../model.js';
import { dateRange, dayBound, endOf, parseDatetime, periodRange, relativeOf, shift, startOf } from './dates.js';
import { scratch, type Context, type Unit } from './units.js';

const SYMBOLS: Record<string, string> = { eq: '=', ne: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
const COLUMN_SYMBOLS: Record<string, string> = {
	columnEq: '=',
	columnNe: '<>',
	columnGt: '>',
	columnGte: '>=',
	columnLt: '<',
	columnLte: '<='
};

export function escapeLike(text: string): string {
	return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function listOf(value: unknown): (string | number)[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry): (string | number)[] => {
		if (typeof entry === 'string') return entry.trim() ? [entry.trim()] : [];
		return typeof entry === 'number' && Number.isFinite(entry) ? [entry] : [];
	});
}

function inList(b: FilterBuilder, column: string, values: (string | number)[], negate: boolean) {
	if (values.length === 1) b.where(column, negate ? '<>' : '=', values[0]);
	else if (negate) b.notWhereIn(column, values);
	else b.whereIn(column, values);
}

export function columnUnit(
	field: FilterField,
	column: string,
	operator: string,
	value: unknown,
	context: Context
): Unit {
	if (operator in COLUMN_SYMBOLS && typeof value === 'string') {
		const b = new FilterBuilder();
		b.whereColumn(column, COLUMN_SYMBOLS[operator], value);
		return { modifiers: b.modifiers as WhereModifier[], logic: 'and' };
	}
	switch (field.type) {
		case 'string':
			return stringUnit(field, column, operator, value);
		case 'number':
			return numberUnit(field, column, operator, value);
		case 'date':
			return dateUnit(field, column, operator, value, context);
		case 'select':
			return selectUnit(field, column, operator, value);
		case 'bool':
			return boolUnit(field, column, operator, context);
	}
	return { modifiers: [], logic: 'and' };
}

function stringUnit(field: StringFilterField, column: string, operator: string, value: unknown): Unit {
	const b = new FilterBuilder();
	let logic: FilterLogic = 'and';
	const text = typeof value === 'string' ? value.trim() : '';
	const blank = field.blankIsEmpty !== false;
	const sensitive = !!field.caseSensitive;
	const regex = sensitive ? '~' : '~*';
	if (operator === 'contains' || operator === 'match')
		b.where(column, sensitive ? 'like' : 'ilike', `%${escapeLike(text)}%`);
	else if (operator === 'notContains')
		b.where(column, sensitive ? 'not like' : 'not ilike', `%${escapeLike(text)}%`);
	else if (operator === 'startsWith') b.where(column, regex, `^${escapeRegex(text)}`);
	else if (operator === 'endsWith') b.where(column, regex, `${escapeRegex(text)}$`);
	else if (operator === 'is') {
		if (sensitive) b.where(column, '=', text);
		else b.where(column, '~*', `^${escapeRegex(text)}$`);
	}
	else if (operator === 'isWord') b.where(column, regex, `\\m${escapeRegex(text)}\\M`);
	else if (operator === 'isNotWord') b.where(column, sensitive ? '!~' : '!~*', `\\m${escapeRegex(text)}\\M`);
	else if (operator === 'isNot') {
		if (sensitive) b.where(column, '<>', text);
		else b.where(column, '!~*', `^${escapeRegex(text)}$`);
	} else if (operator === 'anyOf' || operator === 'noneOf') {
		const list = listOf(value);
		const none = operator === 'noneOf';
		if (sensitive) inList(b, column, list, none);
		else if (list.length) {
			const pattern = list.length === 1 ? escapeRegex(String(list[0])) : `(${list.map((entry) => escapeRegex(String(entry))).join('|')})`;
			b.where(column, none ? '!~*' : '~*', `^${pattern}$`);
		}
	}
	else if (operator === 'like' || operator === 'ilike') b.where(column, operator, text);
	else if (operator === 'empty') {
		b.whereNull(column);
		if (blank) {
			b.orWhere(column, '=', '');
			logic = 'or';
		}
	} else if (operator === 'notEmpty') {
		b.notWhereNull(column);
		if (blank) b.where(column, '<>', '');
	}
	return { modifiers: b.modifiers as WhereModifier[], logic };
}

function numberUnit(field: NumberFilterField, column: string, operator: string, value: unknown): Unit {
	const b = new FilterBuilder();
	let logic: FilterLogic = 'and';
	const scale = field.scale ?? 1;
	const scaled = (input: unknown) =>
		typeof input === 'number' && Number.isFinite(input) ? input * scale : undefined;
	const range = (value ?? {}) as { from?: unknown; to?: unknown };
	if (operator in SYMBOLS) b.where(column, SYMBOLS[operator], scaled(value));
	else if (operator === 'between') b.whereBetween(column, [scaled(range.from), scaled(range.to)]);
	else if (operator === 'notBetween') {
		const from = scaled(range.from);
		const to = scaled(range.to);
		if (from !== undefined) b.where(column, '<', from);
		if (to !== undefined) {
			if (from !== undefined) {
				b.orWhere(column, '>', to);
				logic = 'or';
			} else b.where(column, '>', to);
		}
	} else if (operator === 'anyOf' || operator === 'noneOf')
		inList(b, column, listOf(value).map((entry) => (entry as number) * scale), operator === 'noneOf');
	else if (operator === 'empty') b.whereNull(column);
	else if (operator === 'notEmpty') b.notWhereNull(column);
	return { modifiers: b.modifiers as WhereModifier[], logic };
}

function dateUnit(field: DateFilterField, column: string, operator: string, value: unknown, context: Context): Unit {
	const b = new FilterBuilder();
	let logic: FilterLogic = 'and';
	const dateOnly = !!field.dateOnly;
	const timed = !!field.withTime;
	const day = typeof value === 'string' ? parseISODate(value) : undefined;
	const instant = parseDatetime(value);
	const today = startOf(context.now);
	const range = (value ?? {}) as { from?: string; to?: string };
	const from = timed ? parseDatetime(range.from) : parseISODate(range.from);
	const to = timed ? parseDatetime(range.to) : parseISODate(range.to);
	const relative = relativeOf(value);
	const clock = relative && (relative.unit === 'minutes' || relative.unit === 'hours');
	if (operator === 'is' && day) {
		if (dateOnly) b.where(column, '=', toISODate(day));
		else dateRange(b, column, false, day, day);
	} else if (operator === 'isNot' && day) {
		if (dateOnly) b.where(column, '<>', toISODate(day));
		else {
			b.where(column, '<', startOf(day)).orWhere(column, '>', endOf(day));
			logic = 'or';
		}
	} else if (timed && instant && ['before', 'after', 'onOrBefore', 'onOrAfter'].includes(operator)) {
		const symbol = { before: '<', after: '>', onOrBefore: '<=', onOrAfter: '>=' }[operator]!;
		b.where(column, symbol, instant);
	} else if (operator === 'before' && day) b.where(column, '<', dayBound(day, 'start', dateOnly));
	else if (operator === 'after' && day) b.where(column, '>', dayBound(day, 'end', dateOnly));
	else if (operator === 'onOrBefore' && day) b.where(column, '<=', dayBound(day, 'end', dateOnly));
	else if (operator === 'onOrAfter' && day) b.where(column, '>=', dayBound(day, 'start', dateOnly));
	else if (operator === 'between') {
		if (timed) {
			if (from) b.where(column, '>=', from);
			if (to) b.where(column, '<=', to);
		} else dateRange(b, column, dateOnly, from, to);
	} else if (operator === 'notBetween') {
		const low = from && (timed ? from : dayBound(from, 'start', dateOnly));
		const high = to && (timed ? to : dayBound(to, 'end', dateOnly));
		if (low) b.where(column, '<', low);
		if (high) {
			if (low) {
				b.orWhere(column, '>', high);
				logic = 'or';
			} else b.where(column, '>', high);
		}
	} else if (operator === 'period' && typeof value === 'string') {
		const range = periodRange(value as FilterPeriod, context);
		if (range) dateRange(b, column, dateOnly, range[0], range[1]);
	} else if (relative && ['inLast', 'inNext', 'olderThan', 'laterThan'].includes(operator)) {
		const { amount, unit } = relative;
		if (clock) {
			const now = context.now;
			if (operator === 'inLast') b.where(column, '>=', shift(now, -amount, unit)).where(column, '<=', now);
			else if (operator === 'inNext') b.where(column, '>=', now).where(column, '<=', shift(now, amount, unit));
			else if (operator === 'olderThan') b.where(column, '<', shift(now, -amount, unit));
			else b.where(column, '>', shift(now, amount, unit));
		} else if (operator === 'inLast') dateRange(b, column, dateOnly, shift(today, -amount, unit), today);
		else if (operator === 'inNext') dateRange(b, column, dateOnly, today, shift(today, amount, unit));
		else if (operator === 'olderThan')
			b.where(column, '<', dayBound(shift(today, -amount, unit), 'start', dateOnly));
		else b.where(column, '>', dayBound(shift(today, amount, unit), 'end', dateOnly));
	} else if (operator === 'empty') b.whereNull(column);
	else if (operator === 'notEmpty') b.notWhereNull(column);
	return { modifiers: b.modifiers as WhereModifier[], logic };
}

function selectUnit(field: SelectFilterField, column: string, operator: string, value: unknown): Unit {
	const b = new FilterBuilder();
	let logic: FilterLogic = 'and';
	const values = Array.isArray(value)
		? (value as FilterItem[]).flatMap((item) => item.values ?? [item.value])
		: [];
	if (field.array) {
		const list = values as never;
		if (operator === 'in') b.where(column, '&&', list);
		else if (operator === 'all') b.where(column, '@>', list);
		else if (operator === 'notIn') b.whereNot(column, '&&', list);
		else if (operator === 'empty') {
			b.whereNull(column).orWhere(column, '=', '{}');
			logic = 'or';
		} else if (operator === 'notEmpty') b.notWhereNull(column).where(column, '<>', '{}');
		return { modifiers: b.modifiers as WhereModifier[], logic };
	}
	if (operator === 'in') inList(b, column, values, false);
	else if (operator === 'all') for (const entry of values) b.where(column, '=', entry);
	else if (operator === 'notIn') inList(b, column, values, true);
	else if (operator === 'empty') b.whereNull(column);
	else if (operator === 'notEmpty') b.notWhereNull(column);
	return { modifiers: b.modifiers as WhereModifier[], logic };
}

function boolUnit(field: BoolFilterField, column: string, operator: string, context: Context): Unit {
	const b = new FilterBuilder();
	if (operator === 'isTrue') {
		if (field.whenTrue) return scratch(field.whenTrue, context);
		b.where(column, '=', true);
	} else if (operator === 'isFalse') {
		if (field.whenFalse) return scratch(field.whenFalse, context);
		b.where(column, '=', false);
	} else if (operator === 'empty') b.whereNull(column);
	else if (operator === 'notEmpty') b.notWhereNull(column);
	return { modifiers: b.modifiers as WhereModifier[], logic: 'and' };
}
