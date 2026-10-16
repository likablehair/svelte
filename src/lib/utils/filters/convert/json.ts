import type FilterBuilder from '../builder.js';
import type { WhereModifier } from '../builder.js';
import type { FilterField, FilterItem } from '../model.js';
import { includesEmpty, orEmpty, textUnit } from './text.js';
import { scratch, type Context, type Unit } from './units.js';

function jsonPath(key: string) {
	return `{${key.split('.').join(',')}}`;
}

function nested(key: string, value: unknown): object {
	return key
		.split('.')
		.reduceRight<unknown>((inner, part) => ({ [part]: inner }), value) as object;
}

function rawOf(modifier: WhereModifier, expression: string, column: string, path: string): WhereModifier {
	const connective = modifier.logicalOperator?.startsWith('or') ? 'or' : 'and';
	const negated = !!modifier.logicalOperator?.endsWith('Not');
	if (modifier.kind === 'grouped')
		return { ...modifier, children: modifier.children.map((child) => rawOf(child, expression, column, path)) };
	if (modifier.kind === 'simple')
		return {
			method: 'where',
			kind: 'raw',
			logicalOperator: connective,
			clause: `${negated ? 'not ' : ''}${expression} ${modifier.operator ?? '='} ?`,
			bindings: [column, path, modifier.value]
		};
	if (modifier.kind === 'null')
		return {
			method: 'where',
			kind: 'raw',
			logicalOperator: connective,
			clause: `${expression} is ${negated ? 'not ' : ''}null`,
			bindings: [column, path]
		};
	if (modifier.kind === 'in')
		return {
			method: 'where',
			kind: 'raw',
			logicalOperator: connective,
			clause: `${expression} ${negated ? '<> all' : '= any'}(?)`,
			bindings: [column, path, modifier.value as never]
		};
	if (modifier.kind === 'column')
		return {
			method: 'where',
			kind: 'raw',
			logicalOperator: connective,
			clause: `${expression} ${modifier.operator ?? '='} ??`,
			bindings: [column, path, modifier.column]
		};
	return modifier;
}

export function jsonUnit(field: FilterField, operator: string, value: unknown, context: Context): Unit {
	const { column, key, cast } = field.json!;
	if (cast) {
		const typed = (
			cast === 'date' ? { ...field, dateOnly: true } : field
		) as FilterField;
		const unit = textUnit(typed, ['__json__'], operator, value, context);
		const expression = `(??#>>?)::${cast}`;
		return {
			modifiers: unit.modifiers.map((modifier) => rawOf(modifier, expression, column, jsonPath(key))),
			logic: unit.logic
		};
	}
	const scale = field.type === 'number' ? (field.scale ?? 1) : 1;
	const values = (Array.isArray(value) ? (value as unknown[]) : [value]).flatMap((entry): unknown[] => {
		if (entry && typeof entry === 'object' && 'value' in (entry as object))
			return (entry as FilterItem).values ?? [(entry as FilterItem).value];
		if (typeof entry === 'string') return entry.trim() ? [entry.trim()] : [];
		if (typeof entry === 'number') return Number.isFinite(entry) ? [entry * scale] : [];
		return [entry];
	});
	const array = field.type === 'select' && !!field.array;
	const each = (b: FilterBuilder, or: boolean) => {
		for (const entry of values) {
			const object = nested(key, array ? [entry] : entry);
			if (or) b.orWhereJsonSuperset(column, object);
			else b.whereJsonSuperset(column, object);
		}
	};
	const unit = scratch((b) => {
		if (operator === 'isTrue') b.whereJsonSuperset(column, nested(key, true));
		else if (operator === 'isFalse') b.whereJsonSuperset(column, nested(key, false));
		else if (operator === 'all') b.whereJsonSuperset(column, nested(key, values));
		else if (['is', 'eq', 'in', 'anyOf'].includes(operator)) {
			if (values.length === 1) each(b, false);
			else b.where((q) => each(q, true));
		} else if (['isNot', 'ne', 'notIn', 'noneOf'].includes(operator)) b.whereNot((q) => each(q, true));
	}, context);
	return includesEmpty(field, operator, context) ? orEmpty(column, unit) : unit;
}
